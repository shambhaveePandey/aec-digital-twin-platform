import * as OBC from "@thatopen/components";
import type { FragmentsGroup } from "@thatopen/fragments";
import type { ClassificationNode } from "./types";

export async function classifyByStorey(
  components: OBC.Components,
  model: FragmentsGroup,
): Promise<void> {
  const classifier = components.get(OBC.Classifier);
  await classifier.byStorey(model);
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

  // Classify by both axes so the tree has storey + entity groupings
  await classifyByStorey(components, model);
  await classifyByEntity(components, model);

  const rawTree = await classifier.getClassificationTree(model);

  // Normalise to our ClassificationNode shape
  function normalise(node: Record<string, unknown>): ClassificationNode {
    return {
      name: String(node.name ?? "Unknown"),
      id: node.id !== undefined ? String(node.id) : undefined,
      children: Array.isArray(node.children)
        ? (node.children as Record<string, unknown>[]).map(normalise)
        : undefined,
    };
  }

  return Array.isArray(rawTree)
    ? (rawTree as Record<string, unknown>[]).map(normalise)
    : [];
}

export function isolateClassification(
  components: OBC.Components,
  world: OBC.World,
  classificationName: string,
  value: string,
): void {
  const hider = components.get(OBC.Hider);
  const classifier = components.get(OBC.Classifier);
  const found = classifier.find({ [classificationName]: [value] });
  hider.isolate(world, found);
}

export function showAll(components: OBC.Components, world: OBC.World): void {
  const hider = components.get(OBC.Hider);
  hider.reset(world);
}
