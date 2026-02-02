import { notesContract } from "./notes";
import { foldersContract } from "./folders";
import { calendarContract } from "./calendar";

export const contract = {
  notes: notesContract,
  folders: foldersContract,
  calendar: calendarContract,
};

export type Contract = typeof contract;

export { notesContract, foldersContract, calendarContract };
