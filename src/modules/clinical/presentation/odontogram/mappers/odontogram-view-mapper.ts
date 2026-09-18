import type { ToothSummary } from "@/modules/clinical/odontogram-api";

export const permanentFdiTeeth = [
  "18", "17", "16", "15", "14", "13", "12", "11",
  "21", "22", "23", "24", "25", "26", "27", "28",
  "38", "37", "36", "35", "34", "33", "32", "31",
  "41", "42", "43", "44", "45", "46", "47", "48",
] as const;

export function summaryMap(teeth: ToothSummary[]) {
  return new Map(teeth.map((tooth) => [tooth.toothId, tooth]));
}

export function toothLabel(toothId: string) {
  return `Dente ${toothId}`;
}
