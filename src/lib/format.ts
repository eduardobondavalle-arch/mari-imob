import type { PropertyCosts } from "@/domain/property";
export const money = (cents: number | null) =>
  cents === null
    ? "Sob consulta"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
      }).format(cents / 100);
export function monthlyCosts(costs: PropertyCosts) {
  let total = costs.rent ?? 0;
  let complete = costs.rent !== null;
  let estimated = false;
  for (const expense of [costs.condominium, costs.iptu]) {
    if (expense.amount === null || expense.period === "unknown") {
      complete = false;
      continue;
    }
    total += expense.period === "annual" ? expense.amount / 12 : expense.amount;
    if (expense.period === "annual" && expense.amount > 0) estimated = true;
  }
  return { total: Math.round(total), complete, estimated };
}
