import { z } from "zod";

export const createTwinSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  address: z.string().max(250).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateTwinSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  address: z.string().max(250).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
});

export const listTwinsSchema = z.object({
  workspaceId: z.string().cuid(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  search: z.string().max(100).optional(),
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTwinInput = z.infer<typeof createTwinSchema>;
export type UpdateTwinInput = z.infer<typeof updateTwinSchema>;
export type ListTwinsInput = z.infer<typeof listTwinsSchema>;
