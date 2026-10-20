"use client";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, Modal, Notice } from "./ui";
import {
  zonedInput,
  fromZonedInput,
  formatAppointment,
  shiftDay,
} from "@/lib/mari/time";
type Event = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  typeId: string;
  leadId: string | null;
  propertyId: string | null;
  status: string;
  lead?: { firstName: string } | null;
  property?: { title: string } | null;
};
type Choice = {
  id: string;
  name?: string;
  firstName?: string;
  title?: string;
  code?: string;
};
export function AppointmentEditor({
  event,
  start,
  leadId,
  onClose,
  onSaved,
}: {
  event?: Event;
  start?: string;
  leadId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [inspect, setInspect] = useState<Event | null>(null);
  const [types, setTypes] = useState<Choice[]>([]),
    [leads, setLeads] = useState<Choice[]>([]),
    [properties, setProperties] = useState<Choice[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [conflicts, setConflicts] = useState<Event[]>([]),
    [pending, setPending] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    Promise.all([
      api<Choice[]>("admin/appointment-types"),
      api<Choice[]>("admin/leads"),
      api<Choice[]>("admin/properties"),
    ])
      .then(([t, l, p]) => {
        setTypes(t);
        setLeads(l);
        setProperties(p);
      })
      .catch((e) => setError(e.message));
  }, []);
  const initial =
    event?.startsAt ||
    fromZonedInput(start || `${zonedInput(new Date()).slice(0, 10)}T09:00`);
  async function save(data: Record<string, unknown>, allowConflict = false) {
    setBusy(true);
    setError("");
    try {
      await api(
        `admin/appointments${event ? `/${event.id}` : ""}`,
        { ...data, allowConflict },
        event ? "PUT" : "POST",
      );
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError && Array.isArray(e.details.conflicts)) {
        setConflicts(e.details.conflicts as Event[]);
        setPending(data);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={event ? "Editar compromisso" : "Novo compromisso"}
      onClose={onClose}
    >
      <form
        className="modal-content stack"
        onChange={() => {
          setConflicts([]);
          setPending(null);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            void save({
              title: f.get("title"),
              description: f.get("description"),
              typeId: f.get("typeId"),
              startsAt: fromZonedInput(String(f.get("start"))),
              endsAt: fromZonedInput(String(f.get("end"))),
              leadId: f.get("leadId") || null,
              propertyId: f.get("propertyId") || null,
              status: f.get("status"),
            });
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <p>Horários de Brasília · America/Sao_Paulo</p>
        <label>
          Título
          <input
            name="title"
            defaultValue={event?.title}
            required
            minLength={2}
            maxLength={180}
          />
        </label>
        <label>
          Tipo
          <select name="typeId" defaultValue={event?.typeId || "visit"}>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            Início
            <input
              type="datetime-local"
              name="start"
              required
              defaultValue={zonedInput(initial)}
            />
          </label>
          <label>
            Término
            <input
              type="datetime-local"
              name="end"
              required
              defaultValue={zonedInput(
                event?.endsAt || new Date(Date.parse(initial) + 3600000),
              )}
            />
          </label>
        </div>
        <label>
          Interessado
          <select
            key={`lead-${leads.length}`}
            name="leadId"
            defaultValue={event?.leadId || leadId || ""}
          >
            <option value="">Sem vínculo</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.firstName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Imóvel
          <select
            key={`property-${properties.length}`}
            name="propertyId"
            defaultValue={event?.propertyId || ""}
          >
            <option value="">Sem vínculo</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Observações
          <textarea
            name="description"
            defaultValue={event?.description}
            maxLength={5000}
          />
        </label>
        <label>
          Situação
          <select name="status" defaultValue={event?.status || "scheduled"}>
            <option value="scheduled">Agendado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </label>
        <Notice error>{error}</Notice>
        {conflicts.length > 0 && (
          <div className="conflict-box" role="alert">
            <strong>Conflito de horário identificado</strong>
            <p className="conflict-subtitle">
              Você já possui um compromisso agendado nesse período.
            </p>
            {conflicts.map((c) => (
              <div key={c.id}>
                <p>
                  {c.title}
                  <br />
                  {formatAppointment(c.startsAt)} até{" "}
                  {formatAppointment(c.endsAt)}
                </p>
                <button
                  type="button"
                  className="text-button"
                  onClick={async () => {
                    try {
                      setInspect(
                        await api<Event>(`admin/appointments/${c.id}`),
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Visualizar compromisso existente
                </button>
              </div>
            ))}
            <div className="button-row">
              <button
                type="button"
                className="button secondary"
                onClick={(e) => {
                  setConflicts([]);
                  e.currentTarget.form
                    ?.querySelector<HTMLInputElement>('[name="start"]')
                    ?.focus();
                }}
              >
                Voltar e alterar horário
              </button>
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={() => pending && save(pending, true)}
              >
                Agendar mesmo assim
              </button>
            </div>
          </div>
        )}
        <button className="button" disabled={busy || !types.length}>
          {busy ? "Salvando…" : "Salvar compromisso"}
        </button>
        {event && (
          <button
            type="button"
            className="text-button danger-text"
            disabled={busy}
            onClick={async () => {
              if (!window.confirm("Excluir este compromisso?")) return;
              try {
                await api(`admin/appointments/${event.id}`, {}, "DELETE");
                onSaved();
                onClose();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Excluir compromisso
          </button>
        )}
      </form>
      {inspect && (
        <Modal title="Compromisso existente" onClose={() => setInspect(null)}>
          <div className="modal-content">
            <h2>{inspect.title}</h2>
            <p>
              {formatAppointment(inspect.startsAt)} até{" "}
              {formatAppointment(inspect.endsAt)}
            </p>
            <p>{inspect.description}</p>
            <p>{inspect.lead?.firstName}</p>
            <p>{inspect.property?.title}</p>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
export function Agenda({ leadId }: { leadId?: string }) {
  const [day, setDay] = useState(() => zonedInput(new Date()).slice(0, 10)),
    [view, setView] = useState("month"),
    [events, setEvents] = useState<Event[]>([]),
    [editing, setEditing] = useState<Event | string | null>(null),
    [error, setError] = useState("");
  const first =
    view === "month"
      ? `${day.slice(0, 7)}-01`
      : view === "week"
        ? shiftDay(day, -new Date(`${day}T12:00Z`).getUTCDay())
        : day;
  const count =
    view === "month"
      ? new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)), 0).getDate()
      : view === "week"
        ? 7
        : 1;
  const load = useCallback(
    () =>
      api<Event[]>(
        `admin/appointments?${leadId ? `leadId=${leadId}` : `from=${encodeURIComponent(fromZonedInput(`${first}T00:00`))}&to=${encodeURIComponent(fromZonedInput(`${shiftDay(first, count)}T00:00`))}`}`,
      )
        .then(setEvents)
        .catch((e) => setError(e.message)),
    [leadId, first, count],
  );
  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);
  function navigate(direction: number) {
    if (view === "month") {
      const d = new Date(`${first}T12:00Z`);
      d.setUTCMonth(d.getUTCMonth() + direction);
      setDay(d.toISOString().slice(0, 10));
    } else setDay(shiftDay(day, direction * count));
  }
  const eventButton = (event: Event) => (
    <button
      key={event.id}
      className={`calendar-event ${event.status}`}
      onClick={() => setEditing(event)}
    >
      <strong>{event.title}</strong>
      <span>
        {formatAppointment(event.startsAt)} –{" "}
        {zonedInput(event.endsAt).slice(11)}
      </span>
      {event.lead && <small>{event.lead.firstName}</small>}
      {event.status === "cancelled" && <small>Cancelado</small>}
    </button>
  );
  return (
    <section className="agenda">
      <div className="admin-toolbar">
        <h2>{leadId ? "Compromissos do interessado" : "Agenda"}</h2>
        <button className="button" onClick={() => setEditing(`${day}T09:00`)}>
          Novo compromisso
        </button>
      </div>
      <Notice error>{error}</Notice>
      {leadId ? (
        <div className="event-list">
          {events.map(eventButton)}
          {!events.length && <p>Nenhum compromisso registrado.</p>}
        </div>
      ) : (
        <>
          <div className="calendar-toolbar">
            <button
              className="button small secondary"
              onClick={() => navigate(-1)}
              aria-label="Período anterior"
            >
              ←
            </button>
            <button
              className="button small secondary"
              onClick={() => setDay(zonedInput(new Date()).slice(0, 10))}
            >
              Hoje
            </button>
            <button
              className="button small secondary"
              onClick={() => navigate(1)}
              aria-label="Próximo período"
            >
              →
            </button>
            <label>
              Data
              <input
                type="date"
                value={day}
                onChange={(e) => e.target.value && setDay(e.target.value)}
              />
            </label>
            <label>
              Visualização
              <select value={view} onChange={(e) => setView(e.target.value)}>
                <option value="month">Mês</option>
                <option value="week">Semana</option>
                <option value="day">Dia</option>
              </select>
            </label>
            <small>Horário de Brasília</small>
          </div>
          <div className={`calendar-grid calendar-${view}`}>
            {Array.from({ length: count }, (_, i) => {
              const date = shiftDay(first, i);
              return (
                <section className="calendar-day" key={date}>
                  <button
                    className="calendar-date"
                    onClick={() => setEditing(`${date}T09:00`)}
                  >
                    {new Intl.DateTimeFormat("pt-BR", {
                      timeZone: "UTC",
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    }).format(new Date(`${date}T12:00Z`))}
                    <span> +</span>
                  </button>
                  {events
                    .filter(
                      (e) =>
                        zonedInput(e.startsAt).slice(0, 10) <= date &&
                        zonedInput(new Date(Date.parse(e.endsAt) - 1)).slice(
                          0,
                          10,
                        ) >= date,
                    )
                    .map(eventButton)}
                  {view !== "month" &&
                    [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((hour) => (
                      <button
                        className="calendar-slot"
                        key={hour}
                        onClick={() =>
                          setEditing(
                            `${date}T${String(hour).padStart(2, "0")}:00`,
                          )
                        }
                      >
                        {hour}:00 +
                      </button>
                    ))}
                </section>
              );
            })}
          </div>
        </>
      )}
      {editing && (
        <AppointmentEditor
          event={typeof editing === "object" ? editing : undefined}
          start={typeof editing === "string" ? editing : undefined}
          leadId={leadId}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </section>
  );
}
