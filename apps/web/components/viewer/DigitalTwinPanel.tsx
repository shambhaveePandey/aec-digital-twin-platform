"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import { useDigitalTwin } from "./hooks/useDigitalTwin";
import { type GeoLocation, DEFAULT_LOCATION, readModelLocation } from "@/lib/twin/geo";
import {
  TWIN_STYLE_ACTIVE,
  TWIN_STYLE_ALERT,
  setupTwinHighlighter,
  highlightByGuids,
  clearTwinHighlights,
} from "@/lib/twin/highlight-by-guid";

type Props = {
  components: OBC.Components | null;
  world: OBC.World | null;
  model: FragmentsGroup | null;
};

// A free, token-free raster basemap (OpenStreetMap tiles via the MapLibre demo
// raster style). No API key required, suitable for a static deployment.
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

export function DigitalTwinPanel({ components, world, model }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const [location, setLocation] = useState<GeoLocation>(DEFAULT_LOCATION);

  const [mode, setMode] = useState<"simulator" | "mqtt">("simulator");
  const [brokerUrl, setBrokerUrl] = useState("wss://broker.emqx.io:8084/mqtt");
  const [topicPrefix, setTopicPrefix] = useState("aec-twin/sensors");

  const { status, detail, state, startSimulator, startMqtt, stop, isRunning } =
    useDigitalTwin(components, model);

  // Resolve the model's real-world location once it loads.
  useEffect(() => {
    let cancelled = false;
    if (components && model) {
      void readModelLocation(components, model).then((loc) => {
        if (!cancelled) setLocation(loc);
      });
    } else {
      setLocation(DEFAULT_LOCATION);
    }
    return () => {
      cancelled = true;
    };
  }, [components, model]);

  // Initialise the MapLibre map once the panel is mounted.
  useEffect(() => {
    let cancelled = false;
    const el = mapDivRef.current;
    if (!el || mapRef.current) return;
    void import("maplibre-gl").then((maplibre) => {
      if (cancelled || !mapDivRef.current) return;
      const map = new maplibre.Map({
        container: mapDivRef.current,
        style: OSM_STYLE,
        center: [location.lon, location.lat],
        zoom: 16,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      const marker = new maplibre.Marker({ color: "#3b82f6" })
        .setLngLat([location.lon, location.lat])
        .addTo(map);
      mapRef.current = map;
      markerRef.current = marker;
    });
    return () => {
      cancelled = true;
      markerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Init once; location updates are handled in a separate effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentre the map + marker whenever the resolved location changes.
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLngLat([location.lon, location.lat]);
    map.easeTo({ center: [location.lon, location.lat], duration: 600 });
  }, [location]);

  // Set up the Highlighter the first time we have a world.
  useEffect(() => {
    if (components && world) setupTwinHighlighter(components, world);
  }, [components, world]);

  // Reflect live sensor state into the 3D scene: active sensors blue, alerts red.
  useEffect(() => {
    if (!components || !world) return;
    const active = Array.from(state.activeGuids).filter(
      (g) => !state.alertGuids.has(g),
    );
    const alerts = Array.from(state.alertGuids);
    clearTwinHighlights(components);
    void highlightByGuids(components, active, TWIN_STYLE_ACTIVE);
    void highlightByGuids(components, alerts, TWIN_STYLE_ALERT);
  }, [components, world, state]);

  // Clear highlights when the twin stops.
  useEffect(() => {
    if (!isRunning && components) clearTwinHighlights(components);
  }, [isRunning, components]);

  const latestRows = useMemo(() => {
    return Array.from(state.readings.values())
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 12);
  }, [state.readings]);

  const statusColor =
    status === "connected"
      ? "text-green-400"
      : status === "connecting"
        ? "text-yellow-400"
        : status === "error"
          ? "text-red-400"
          : "text-neutral-500";

  const shortGuid = (g: string) => (g.length > 10 ? `${g.slice(0, 8)}…` : g);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* ── World-map / GIS context ── */}
      <section className="border-b border-neutral-800 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Site location
        </h3>
        <div
          ref={mapDivRef}
          className="h-44 w-full overflow-hidden rounded-md border border-neutral-800 bg-neutral-950"
          aria-label="Model location on world map"
        />
        <p className="mt-1.5 text-[11px] text-neutral-500">
          {location.source === "ifc-site" ? (
            <>
              From IfcSite{location.siteName ? ` · ${location.siteName}` : ""}:{" "}
              {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
            </>
          ) : (
            <>
              No georeference in IFC — showing default ({location.lat.toFixed(4)},{" "}
              {location.lon.toFixed(4)})
            </>
          )}
        </p>
      </section>

      {/* ── IoT realtime integration ── */}
      <section className="border-b border-neutral-800 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Realtime IoT
        </h3>

        <div className="mb-2 flex gap-1">
          {(["simulator", "mqtt"] as const).map((m) => (
            <button
              key={m}
              disabled={isRunning}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors disabled:opacity-50 ${
                mode === m
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {m === "mqtt" ? "MQTT broker" : "Demo simulator"}
            </button>
          ))}
        </div>

        {mode === "mqtt" && (
          <div className="mb-2 space-y-1.5">
            <input
              value={brokerUrl}
              onChange={(e) => setBrokerUrl(e.target.value)}
              disabled={isRunning}
              placeholder="wss://broker:port/mqtt"
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
            <input
              value={topicPrefix}
              onChange={(e) => setTopicPrefix(e.target.value)}
              disabled={isRunning}
              placeholder="topic prefix"
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
            <p className="text-[10px] leading-snug text-neutral-500">
              Subscribes to{" "}
              <code className="text-neutral-400">{topicPrefix}/&lt;guid&gt;</code>.
              Payload: JSON {`{ guid, metric, value, unit, ts }`}.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              disabled={!model}
              onClick={() =>
                mode === "simulator"
                  ? startSimulator()
                  : startMqtt(brokerUrl, topicPrefix)
              }
              className="rounded-md bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              Connect
            </button>
          ) : (
            <button
              onClick={stop}
              className="rounded-md bg-neutral-700 px-3 py-1 text-[11px] font-medium text-white hover:bg-neutral-600"
            >
              Disconnect
            </button>
          )}
          <span className={`text-[11px] ${statusColor}`}>
            {status}
            {detail ? ` · ${detail}` : ""}
          </span>
        </div>
      </section>

      {/* ── Live readings ── */}
      <section className="flex-1 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Live readings
          </h3>
          <span className="text-[10px] text-neutral-500">
            {state.activeGuids.size} sensors · {state.alertGuids.size} alerts
          </span>
        </div>

        {latestRows.length === 0 ? (
          <p className="text-[11px] text-neutral-500">
            {isRunning
              ? "Waiting for data…"
              : "Connect a source to stream live element telemetry. Active elements are highlighted blue in the viewer; alerts turn red."}
          </p>
        ) : (
          <ul className="space-y-1">
            {latestRows.map((r) => {
              const alert = state.alertGuids.has(r.guid);
              return (
                <li
                  key={`${r.guid}|${r.metric}`}
                  className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] ${
                    alert
                      ? "border-red-800 bg-red-950/40"
                      : "border-neutral-800 bg-neutral-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${alert ? "bg-red-400" : "bg-blue-400"}`}
                    />
                    <span className="text-neutral-400">{r.metric}</span>
                    <code className="text-neutral-600">{shortGuid(r.guid)}</code>
                  </span>
                  <span className={alert ? "text-red-300" : "text-neutral-200"}>
                    {r.value}
                    {r.unit ? ` ${r.unit}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
