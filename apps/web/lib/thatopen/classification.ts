import * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import type { ClassificationNode } from "./types";

export async function classifyByStorey(
  components: OBC.Components,
  model: FragmentsGroup,
): Promise<void> {
  const classifier = components.get(OBC.Classifier);
  // v2.x uses bySpatialStructure instead of byStorey. This requires the
  // model's IFC relations to be indexed first (see loadIfcInBrowser, which
  // runs IfcRelationsIndexer.process). If relations are still unavailable
  // (e.g. an IFC without spatial structure), don't let it break the tree —
  // entity-based classification below still provides a useful grouping.
  try {
    await classifier.bySpatialStructure(model);
  } catch {
    // No spatial-structure grouping for this model; continue gracefully.
  }
}

export async function classifyByEntity(
  components: OBC.Components,
  model: FragmentsGroup,
): Promise<void> {
  const classifier = components.get(OBC.Classifier);
  await classifier.byEntity(model);
}

export async function getModelTree(
  components: OBC.Components,
  model: FragmentsGroup,
): Promise<ClassificationNode[]> {
  const classifier = components.get(OBC.Classifier);

  // Ensure relations are indexed (deferred from load time for faster first
  // paint). Idempotent: runs at most once per model.
  const { ensureRelationsIndexed } = await import(
    "./load-ifc-client-preview"
  );
  await ensureRelationsIndexed(components, model);

  await classifyByStorey(components, model);
  try {
    await classifyByEntity(components, model);
  } catch {
    // Entity classification is best-effort; ignore if it fails.
  }

  // Build a ClassificationNode tree from classifier.list.
  // Shape: list[system][groupName] = { map: FragmentIdMap, name, id }
  const list = classifier.list as Record<
    string,
    Record<string, { map?: Record<string, Set<number>>; name?: string }>
  >;

  const modelUuid = (model as { uuid?: string }).uuid ?? "";

  return Object.entries(list).map(([systemName, values]) => ({
    name: systemName,
    system: systemName,
    children: Object.entries(values).map(([value, entry]) => {
      // Flatten the FragmentIdMap (fragmentId -> Set<expressId>) into a list
      // of express ids so the tree can drive selection in the viewer.
      const expressIds: number[] = [];
      const map = entry?.map ?? {};
      for (const ids of Object.values(map)) {
        for (const id of ids as Set<number>) expressIds.push(id);
      }
      return {
        name: value,
        system: systemName,
        expressIds,
        modelUuid,
      };
    }),
  }));
}

export function isolateClassification(
  components: OBC.Components,
  _world: OBC.World,
  classificationName: string,
  value: string,
): void {
  const hider = components.get(OBC.Hider);
  const classifier = components.get(OBC.Classifier);
  const found = classifier.find({ [classificationName]: [value] });
  // v2.x Hider.isolate takes only the FragmentIdMap (no world parameter)
  hider.isolate(found);
}

export function showAll(components: OBC.Components, _world: OBC.World): void {
  const hider = components.get(OBC.Hider);
  // v2.x Hider.set(visible, items?) — omitting items affects all fragments
  hider.set(true);
}
