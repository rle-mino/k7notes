import { Module } from "@nestjs/common";
import { CalendarController } from "./calendar.controller.js";
import { CalendarService } from "./calendar.service.js";
import { GoogleCalendarProvider } from "./providers/google-calendar.provider.js";
import { MicrosoftCalendarProvider } from "./providers/microsoft-calendar.provider.js";

@Module({
  controllers: [CalendarController],
  providers: [CalendarService, GoogleCalendarProvider, MicrosoftCalendarProvider],
  exports: [CalendarService],
})
export class CalendarModule {}
