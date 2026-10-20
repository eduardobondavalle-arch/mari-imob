export const calendarTimeZone = "America/Sao_Paulo";
export function zonedInput(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: calendarTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const p = Object.fromEntries(parts.map((i) => [i.type, i.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export function fromZonedInput(value: string) {
  const target = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(target))
    throw new Error("Informe uma data e um horário válidos.");
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const local = Date.parse(`${zonedInput(new Date(instant))}:00Z`);
    instant += target - local;
  }
  if (zonedInput(new Date(instant)) !== value)
    throw new Error("Horário inválido no fuso de Brasília.");
  return new Date(instant).toISOString();
}
export const formatAppointment = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: calendarTimeZone,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
export function shiftDay(day: string, days: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
