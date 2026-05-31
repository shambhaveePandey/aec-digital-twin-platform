import type { Sensor, SensorReading } from "@prisma/client";
import type { SensorStatus } from "./enums";
import { prisma } from "./client";

// ─── Sensors ──────────────────────────────────────────────────────────────────

export type CreateSensorInput = {
  twinId: string;
  name: string;
  description?: string;
  unit?: string;
  ifcGuid?: string;
  expressId?: number;
  mqttTopic?: string;
  externalId?: string;
  thresholdMin?: number;
  thresholdMax?: number;
};

export async function createSensor(data: CreateSensorInput): Promise<Sensor> {
  return prisma.sensor.create({ data });
}

export async function getSensorById(id: string): Promise<Sensor | null> {
  return prisma.sensor.findUnique({ where: { id } });
}

export async function listSensors(twinId: string): Promise<Sensor[]> {
  return prisma.sensor.findMany({
    where: { twinId },
    orderBy: { name: "asc" },
  });
}

export async function getSensorByMqttTopic(mqttTopic: string): Promise<Sensor | null> {
  return prisma.sensor.findFirst({ where: { mqttTopic } });
}

export async function getSensorsByIfcGuid(
  twinId: string,
  ifcGuid: string,
): Promise<Sensor[]> {
  return prisma.sensor.findMany({ where: { twinId, ifcGuid } });
}

export type UpdateSensorInput = Partial<
  Pick<
    Sensor,
    | "name"
    | "description"
    | "unit"
    | "ifcGuid"
    | "expressId"
    | "mqttTopic"
    | "externalId"
    | "thresholdMin"
    | "thresholdMax"
    | "status"
  >
>;

export async function updateSensor(id: string, data: UpdateSensorInput): Promise<Sensor> {
  return prisma.sensor.update({ where: { id }, data });
}

export async function deleteSensor(id: string): Promise<void> {
  await prisma.sensor.delete({ where: { id } });
}

export async function updateSensorLastValue(id: string, value: number): Promise<Sensor> {
  return prisma.sensor.update({
    where: { id },
    data: { lastValue: value, lastSeenAt: new Date(), status: "ACTIVE" },
  });
}

export async function markSensorStale(id: string): Promise<Sensor> {
  return prisma.sensor.update({ where: { id }, data: { status: "STALE" } });
}

export async function bulkUpdateSensorStatuses(
  twinId: string,
  status: SensorStatus,
): Promise<void> {
  await prisma.sensor.updateMany({ where: { twinId }, data: { status } });
}

// ─── Sensor Readings ──────────────────────────────────────────────────────────

export type RecordSensorReadingInput = {
  sensorId: string;
  value: number;
  unit?: string;
  quality?: number;
  timestamp?: Date;
};

/** Persists a reading and updates the sensor's lastValue/lastSeenAt atomically. */
export async function recordSensorReading(
  data: RecordSensorReadingInput,
): Promise<SensorReading> {
  const { sensorId, ...rest } = data;
  const [reading] = await prisma.$transaction([
    prisma.sensorReading.create({ data: { sensorId, ...rest } }),
    prisma.sensor.update({
      where: { id: sensorId },
      data: { lastValue: rest.value, lastSeenAt: new Date(), status: "ACTIVE" },
    }),
  ]);
  return reading;
}

export async function getLatestSensorReading(
  sensorId: string,
): Promise<SensorReading | null> {
  return prisma.sensorReading.findFirst({
    where: { sensorId },
    orderBy: { timestamp: "desc" },
  });
}

export type SensorReadingsOptions = {
  from?: Date;
  to?: Date;
  limit?: number;
};

export async function getSensorReadings(
  sensorId: string,
  options: SensorReadingsOptions = {},
): Promise<SensorReading[]> {
  const { from, to, limit = 500 } = options;
  return prisma.sensorReading.findMany({
    where: {
      sensorId,
      ...(from || to
        ? {
            timestamp: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: { timestamp: "asc" },
    take: limit,
  });
}

export async function deleteOldSensorReadings(
  sensorId: string,
  before: Date,
): Promise<number> {
  const result = await prisma.sensorReading.deleteMany({
    where: { sensorId, timestamp: { lt: before } },
  });
  return result.count;
}
