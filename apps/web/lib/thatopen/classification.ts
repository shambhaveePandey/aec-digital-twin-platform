import * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import type { ClassificationNode } from "./types";

export async function classifyByStorey(
  components: OBC.Components,
  model: FragmentsGroup,
): Promise<void> {
  const classifier = components.get(OBC.Classifier);
  // v2.x uses bySpatialStructure instead of byStorey
  await classifier.bySpatialStructure(model);
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

  await classifyByStorey(components, model);
  await classifyByEntity(components, model);

  // Build a ClassificationNode tree from classifier.list
  // list: Record<systemName, Record<value, FragmentIdMap>>
  const list = classifier.list as Record<string, Record<string, unknown>>;

  return Object.entries(list).map(([systemName, values]) => ({
    name: systemName,
    children: Object.keys(values).map((value) => ({ name: value })),
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
