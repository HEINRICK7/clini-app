export type AgendaView = "day" | "week" | "month";

export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function instant(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function addDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + amount);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function nextDate(date: string) {
  return addDays(date, 1);
}

export function rangeEnd(date: string, view: AgendaView) {
  return addDays(date, view === "day" ? 1 : view === "week" ? 7 : 30);
}

export function formatRangeLabel(date: string, view: AgendaView) {
  const start = new Date(`${date}T12:00:00`);
  if (view === "day") return start.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const end = new Date(`${addDays(date, view === "week" ? 6 : 29)}T12:00:00`);
  return `${start.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`;
}

export function displayTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
