export type InstallmentDraft = {
  number: number;
  amountCents: number;
  dueOn: string;
};

export function buildInstallments(unitPriceCents: number, quantity: number, discountCents: number, count: number, firstDueOn: string): InstallmentDraft[] | undefined {
  if (count <= 1 || !firstDueOn) return undefined;
  const total = unitPriceCents * quantity - discountCents;
  if (total < count) return undefined;
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_, index) => ({ number: index + 1, amountCents: base + (index < remainder ? 1 : 0), dueOn: addMonths(firstDueOn, index) }));
}

export function addMonths(date: string, months: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() + months);
  return value.toISOString().slice(0, 10);
}
