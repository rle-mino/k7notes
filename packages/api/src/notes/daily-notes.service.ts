import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { NotesService, type Note } from "./notes.service.js";
import { FoldersService } from "../folders/folders.service.js";
import { CalendarService } from "../calendar/calendar.service.js";
import type { CalendarEvent } from "@k7notes/contracts";

@Injectable()
export class DailyNotesService {
  private readonly logger = new Logger(DailyNotesService.name);

  constructor(
    private readonly notesService: NotesService,
    private readonly foldersService: FoldersService,
    private readonly calendarService: CalendarService,
  ) {}

  /**
   * Creates a daily note for the given date, or returns the existing one.
   * Auto-creates the folder hierarchy Daily/YYYY/MM/DD.
   * If calendar connections exist, populates the note with event sections.
   */
  async createDailyNote(userId: string, date: string): Promise<Note> {
    // Check if daily note already exists for this date
    const existing = await this.findDailyNote(userId, date);
    if (existing) {
      return existing;
    }

    // Parse date to get folder path segments
    const { year, month, day } = this.parseDateString(date);

    // Create folder hierarchy: Daily/YYYY/MM/DD
    const leafFolder = await this.foldersService.findOrCreatePath(userId, [
      "Daily",
      year,
      month,
      day,
    ]);

    // Fetch calendar events for this date (if any connections exist)
    const events = await this.fetchCalendarEvents(userId, date);

    // Generate note content with event sections
    const content = this.generateDailyNoteContent(date, events);

    // Create the daily note
    return this.notesService.create(userId, {
      title: date,
      content,
      kind: "DAILY",
      date,
      folderId: leafFolder.id,
    });
  }

  /**
   * Refreshes calendar events on an existing daily note.
   * Adds any new events not already present in the note content.
   */
  async refreshDailyNoteEvents(userId: string, noteId: string): Promise<Note> {
    const note = await this.notesService.findOne(userId, noteId);

    if (note.kind !== "DAILY") {
      throw new NotFoundException("Note is not a daily note");
    }

    if (!note.date) {
      throw new NotFoundException("Daily note has no date");
    }

    // Fetch current calendar events for the note's date
    const events = await this.fetchCalendarEvents(userId, note.date);

    // Parse existing content to find already-present event headings
    const existingHeadings = this.parseEventHeadings(note.content);

    // Filter to only new events
    const newEvents = events.filter((event) => {
      const heading = this.formatEventHeading(event);
      return !existingHeadings.has(heading);
    });

    if (newEvents.length === 0) {
      return note;
    }

    // Append new event sections to existing content
    const newSections = newEvents
      .map((event) => `## ${this.formatEventHeading(event)}\n\n`)
      .join("");

    const updatedContent = note.content.trimEnd() + "\n\n" + newSections.trimEnd();

    return this.notesService.update(userId, noteId, {
      content: updatedContent,
    });
  }

  /**
   * Finds a daily note for the given date. Returns null if not found.
   */
  async findDailyNote(userId: string, date: string): Promise<Note | null> {
    return this.notesService.findByKindAndDate(userId, "DAILY", date);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private parseDateString(date: string): {
    year: string;
    month: string;
    day: string;
  } {
    const parts = date.split("-");
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    if (!year || !month || !day) {
      throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
    }

    return { year, month, day };
  }

  /**
   * Fetches calendar events across all active connections for a given date.
   * Returns an empty array if no connections exist or on error.
   */
  private async fetchCalendarEvents(
    userId: string,
    date: string,
  ): Promise<CalendarEvent[]> {
    try {
      const connections = await this.calendarService.listConnections(userId);

      if (connections.length === 0) {
        return [];
      }

      // Build date range: start of day to end of day (UTC)
      const startDate = new Date(`${date}T00:00:00.000Z`);
      const endDate = new Date(`${date}T23:59:59.999Z`);

      const allEvents: CalendarEvent[] = [];

      for (const connection of connections) {
        if (!connection.isActive) continue;

        try {
          const events = await this.calendarService.listEvents(
            userId,
            connection.id,
            undefined, // primary calendar
            startDate,
            endDate,
            50,
          );
          allEvents.push(...events);
        } catch (err) {
          this.logger.warn(
            `Failed to fetch events from connection ${connection.id}: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      }

      // Sort events by start time
      allEvents.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );

      // Deduplicate by event id
      const seen = new Set<string>();
      return allEvents.filter((event) => {
        if (seen.has(event.id)) return false;
        seen.add(event.id);
        return true;
      });
    } catch (err) {
      this.logger.warn(
        `Failed to fetch calendar events for ${date}: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      return [];
    }
  }

  /**
   * Generates the initial markdown content for a daily note.
   */
  private generateDailyNoteContent(
    date: string,
    events: CalendarEvent[],
  ): string {
    if (events.length === 0) {
      return `# ${date}\n\n`;
    }

    const eventSections = events
      .map((event) => `## ${this.formatEventHeading(event)}\n\n`)
      .join("");

    return `# ${date}\n\n${eventSections}`;
  }

  /**
   * Formats a calendar event into a heading string: "HH:MM - Event Title"
   */
  private formatEventHeading(event: CalendarEvent): string {
    if (event.isAllDay) {
      return `All Day - ${event.title}`;
    }

    const startTime = new Date(event.startTime);
    const hours = startTime.getUTCHours().toString().padStart(2, "0");
    const minutes = startTime.getUTCMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes} - ${event.title}`;
  }

  /**
   * Parses existing note content to extract event heading strings.
   * Matches lines like "## HH:MM - Event Title" or "## All Day - Event Title"
   */
  private parseEventHeadings(content: string): Set<string> {
    const headings = new Set<string>();
    const lines = content.split("\n");

    for (const line of lines) {
      const match = line.match(/^## (.+)$/);
      if (match?.[1]) {
        headings.add(match[1]);
      }
    }

    return headings;
  }
}
