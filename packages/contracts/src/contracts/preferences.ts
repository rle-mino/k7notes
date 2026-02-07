import { oc } from "@orpc/contract";
import { UserPreferencesSchema, GetPreferencesInputSchema, UpdatePreferencesSchema } from "../schemas/preferences";

export const preferencesContract = {
  get: oc.route({ method: "GET", path: "/api/preferences" }).input(GetPreferencesInputSchema).output(UserPreferencesSchema),
  update: oc.route({ method: "PUT", path: "/api/preferences" }).input(UpdatePreferencesSchema).output(UserPreferencesSchema),
};
