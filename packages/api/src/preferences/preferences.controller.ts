import { Controller } from "@nestjs/common";
import { Implement } from "@orpc/nest";
import { contract } from "@k7notes/contracts";
import { authed } from "../auth/auth.middleware.js";
import { PreferencesService } from "./preferences.service.js";

@Controller()
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Implement(contract.preferences.get)
  get() {
    return authed(contract.preferences.get).handler(async ({ input, context }) => {
      return this.preferencesService.getOrCreate(context.user.id, input.deviceLanguage);
    });
  }

  @Implement(contract.preferences.update)
  update() {
    return authed(contract.preferences.update).handler(async ({ input, context }) => {
      return this.preferencesService.update(context.user.id, input);
    });
  }
}
