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

const toothNames: Record<string, string> = {
  "1": "incisivo central",
  "2": "incisivo lateral",
  "3": "canino",
  "4": "primeiro pré-molar",
  "5": "segundo pré-molar",
  "6": "primeiro molar",
  "7": "segundo molar",
  "8": "terceiro molar",
};

export function toothMetadata(toothId: string) {
  const quadrant = toothId[0];
  const name = toothNames[toothId[1]] ?? "dente";
  const arch = quadrant === "1" || quadrant === "2" ? "superior" : "inferior";
  const side = quadrant === "1" || quadrant === "4" ? "direito" : "esquerdo";
  return {
    name: `${name} ${arch} ${side}`,
    arch: `${arch} · lado ${side}`,
  };
}
