import { z } from "zod";

export const requestUploadSchema = z.object({
  twinId: z.string().cuid(),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(2 * 1024 * 1024 * 1024), // 2 GB max
});

export const createSensorSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  unit: z.string().max(20).optional(),
  ifcGuid: z.string().max(22).optional(),
  mqttTopic: z.string().max(256).optional(),
  externalId: z.string().max(256).optional(),
  thresholdMin: z.number().optional(),
  thresholdMax: z.number().optional(),
});

export const updateSensorSchema = createSensorSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;
export type CreateSensorInput = z.infer<typeof createSensorSchema>;
