import { notesContract } from "./notes";
import { foldersContract } from "./folders";
import { calendarContract } from "./calendar";
import { transcriptionsContract } from "./transcriptions";
import { preferencesContract } from "./preferences";

export const contract = {
  notes: notesContract,
  folders: foldersContract,
  calendar: calendarContract,
  transcriptions: transcriptionsContract,
  preferences: preferencesContract,
};

export type Contract = typeof contract;

export { notesContract, foldersContract, calendarContract, transcriptionsContract, preferencesContract };
