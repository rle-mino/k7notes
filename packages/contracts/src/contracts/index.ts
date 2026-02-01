import { notesContract } from "./notes";
import { foldersContract } from "./folders";

export const contract = {
  notes: notesContract,
  folders: foldersContract,
};

export type Contract = typeof contract;

export { notesContract, foldersContract };
