export function localCalendarDate(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function greetingForHour(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function formatDashboardDate(date: string) {
  const formatted = new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function activeUnits<T extends { status: string }>(units: T[]) {
  return units.filter((unit) => unit.status === "ACTIVE");
}

export function resolveCurrentUnitId<T extends { id: string; primary: boolean }>(selectedUnitId: string | undefined, units: T[]) {
  return selectedUnitId ?? units.find((unit) => unit.primary)?.id ?? "";
}
