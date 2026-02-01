import { z } from "zod";

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export const SuccessResponseSchema = z.object({
  success: z.literal(true),
});

export type IdParam = z.infer<typeof IdParamSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
