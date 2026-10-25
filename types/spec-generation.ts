import { z } from "zod";

import { aiChatMessageSchema } from "@/types/tasks";

export const specChatMessageSchema = aiChatMessageSchema.extend({
  sender: z.string().min(1).max(80),
  content: z.string().min(1).max(2000),
});

export const generateSpecNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  data: z
    .object({
      label: z.string().optional(),
      shape: z.string().optional(),
      color: z.string().optional(),
    })
    .optional(),
});

export const generateSpecEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.string().optional(),
  data: z
    .object({
      label: z.string().optional(),
    })
    .optional(),
});

export const generateSpecRequestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(specChatMessageSchema).max(50),
});

export const generateSpecTaskSchema = generateSpecRequestSchema.extend({
  projectId: z.string().min(1),
});

export const generateSpecTokenRequestSchema = z.object({
  runId: z.string().min(1),
});

export type GenerateSpecNode = z.infer<typeof generateSpecNodeSchema>;
export type GenerateSpecEdge = z.infer<typeof generateSpecEdgeSchema>;
export type SpecChatMessage = z.infer<typeof specChatMessageSchema>;
export type GenerateSpecRequest = z.infer<typeof generateSpecRequestSchema>;
export type GenerateSpecTaskInput = z.infer<typeof generateSpecTaskSchema>;
export type GenerateSpecTokenRequest = z.infer<
  typeof generateSpecTokenRequestSchema
>;
