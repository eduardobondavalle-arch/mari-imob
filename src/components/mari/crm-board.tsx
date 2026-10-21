"use client";
import { useCallback, useEffect, useState } from "react";
import { api, Modal, Notice, Busy } from "./ui";
import { phoneMask } from "@/lib/mari/types";
import { formatAppointment } from "@/lib/mari/time";
type Card = {
  id: string;
  firstName: string;
  phone: string;
  lastActivityAt: string;
  selections: { items: { propertyId: string }[] }[];
  appointments: { title: string; startsAt: string }[];
  qualified: boolean;
};
type Stage = { id: string; name: string; isDefault: boolean; funnelEnabled: boolean; funnelPosition: number | null; leads: Card[] };
export function CrmBoard({ onOpen }: { onOpen: (id: string) => void }) {
  const [stages, setStages] = useState<Stage[]>([]),
    [q, setQ] = useState(""),
    [qualifiedOnly, setQualifiedOnly] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<"lead" | "stage" | Stage | null>(null),
    [drag, setDrag] = useState<string | null>(null);
  const load = useCallback(
    () =>
      api<Stage[]>(`admin/board?q=${encodeURIComponent(q)}&qualified=${qualifiedOnly}`)
        .then(setStages)
        .catch((e) => setError(e.message)),
    [q, qualifiedOnly],
  );
  useEffect(() => {
    const timer = setTimeout(load, 200),
      refresh = setInterval(load, 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(refresh);
    };
  }, [load]);
  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await work();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function move(
    leadId: string,
    stageId: string,
    beforeId: string | null = null,
  ) {
    if (leadId === beforeId) return;
    void run(() => api("admin/lead-move", { leadId, stageId, beforeId }));
    setDrag(null);
  }
  return (
    <section className="crm-board-wrap">
      <div className="admin-toolbar">
        <input
          aria-label="Buscar interessados"
          placeholder="Buscar por nome ou telefone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="check-line crm-qualified-filter">
          <input type="checkbox" checked={qualifiedOnly} onChange={(e) => setQualifiedOnly(e.target.checked)} />
          Somente perfis qualificados
        </label>
        <div className="button-row">
          <button
            className="button secondary"
            onClick={() => setDialog("stage")}
          >
            Nova coluna
          </button>
          <button className="button" onClick={() => setDialog("lead")}>
            Novo interessado
          </button>
        </div>
      </div>
      <p className="muted">
        Arraste os cartões ou use os controles de cada interessado. Atualização
        automática a cada 15 segundos.
      </p>
      <Notice error>{error}</Notice>
      <div className="kanban" aria-busy={busy}>
        {stages.map((stage, index) => (
          <section
            className="kanban-column"
            key={stage.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (drag) move(drag, stage.id);
            }}
          >
            <header>
              <h2>
                {stage.name} <small>{stage.leads.length}</small>
              </h2>
              <button
                className="text-button"
                aria-label={`Configurar ${stage.name}`}
                onClick={() => setDialog(stage)}
              >
                Editar
              </button>
              <div className="button-row">
                {[-1, 1].map((delta) => (
                  <button
                    key={delta}
                    className="icon-button"
                    disabled={
                      busy ||
                      index + delta < 0 ||
                      index + delta >= stages.length
                    }
                    aria-label={`${delta < 0 ? "Mover coluna para esquerda" : "Mover coluna para direita"}: ${stage.name}`}
                    onClick={() =>
                      run(() => {
                        const ids = stages.map((s) => s.id);
                        [ids[index], ids[index + delta]] = [
                          ids[index + delta],
                          ids[index],
                        ];
                        return api("admin/stages/order", { ids }, "PUT");
                      })
                    }
                  >
                    {delta < 0 ? "←" : "→"}
                  </button>
                ))}
              </div>
            </header>
            {stage.leads.map((lead, li) => (
              <article
                className="kanban-card"
                key={lead.id}
                draggable={!busy}
                onDragStart={() => setDrag(lead.id)}
                onDragEnd={() => setDrag(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (drag) move(drag, stage.id, lead.id);
                }}
              >
                <button className="lead-open" onClick={() => onOpen(lead.id)}>
                  <strong>{lead.firstName}</strong>
                  <span>{phoneMask(lead.phone)}</span>
                </button>
                {lead.qualified && <span className="qualified-badge">Perfil qualificado</span>}
                <p>
                  {
                    new Set(
                      lead.selections.flatMap((s) =>
                        s.items.map((i) => i.propertyId),
                      ),
                    ).size
                  }{" "}
                  imóveis selecionados
                </p>
                <small>
                  Atividade: {formatAppointment(lead.lastActivityAt)}
                </small>
                {lead.appointments[0] && (
                  <p className="upcoming-event">
                    {lead.appointments[0].title}
                    <br />
                    {formatAppointment(lead.appointments[0].startsAt)}
                  </p>
                )}
                <div className="card-movement">
                  <select
                    aria-label={`Mover ${lead.firstName} para coluna`}
                    value={stage.id}
                    disabled={busy}
                    onChange={(e) => move(lead.id, e.target.value)}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="icon-button"
                    disabled={busy || li === 0 || !!q}
                    aria-label={`Subir ${lead.firstName}`}
                    onClick={() =>
                      move(lead.id, stage.id, stage.leads[li - 1].id)
                    }
                  >
                    ↑
                  </button>
                  <button
                    className="icon-button"
                    disabled={busy || li === stage.leads.length - 1 || !!q}
                    aria-label={`Descer ${lead.firstName}`}
                    onClick={() =>
                      move(lead.id, stage.id, stage.leads[li + 2]?.id || null)
                    }
                  >
                    ↓
                  </button>
                </div>
              </article>
            ))}
            {!stage.leads.length && (
              <p className="kanban-empty">Nenhum interessado nesta coluna.</p>
            )}
          </section>
        ))}
      </div>
      {!stages.length && <Busy />}
      {dialog && (
        <Modal
          title={dialog === "lead" ? "Novo interessado" : "Configurar coluna"}
          onClose={() => setDialog(null)}
        >
          <form
            className="modal-content stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void run(async () => {
                if (dialog === "lead") {
                  const lead = await api<{ id: string; existing: boolean }>(
                    "admin/leads",
                    {
                      firstName: f.get("firstName"),
                      phone: f.get("phone"),
                      notes: f.get("notes"),
                    },
                  );
                  setDialog(null);
                  onOpen(lead.id);
                } else {
                  await api(
                    `admin/stages${typeof dialog === "object" ? `/${dialog.id}` : ""}`,
                    {
                      name: f.get("name"),
                      funnelEnabled: f.get("funnelEnabled") === "on",
                      funnelPosition: f.get("funnelPosition") ? Number(f.get("funnelPosition")) : null,
                    },
                    typeof dialog === "object" ? "PUT" : "POST",
                  );
                  setDialog(null);
                }
              });
            }}
          >
            {dialog === "lead" ? (
              <>
                <label>
                  Primeiro nome
                  <input name="firstName" required minLength={2} />
                </label>
                <label>
                  Telefone com DDD
                  <input
                    name="phone"
                    required
                    type="tel"
                    onChange={(e) => {
                      e.target.value = phoneMask(e.target.value);
                    }}
                  />
                </label>
                <label>
                  Observação inicial
                  <textarea name="notes" maxLength={5000} />
                </label>
                <p>
                  Se o telefone já estiver cadastrado, o registro existente será
                  aberto.
                </p>
              </>
            ) : (
              <>
                <label>
                  Nome da coluna
                  <input name="name" required minLength={2} defaultValue={typeof dialog === "object" ? dialog.name : ""} />
                </label>
                <label className="check-line">
                  <input name="funnelEnabled" type="checkbox" defaultChecked={typeof dialog === "object" ? dialog.funnelEnabled : false} />
                  Incluir esta etapa no funil comercial
                </label>
                <label>
                  Ordem no funil
                  <input name="funnelPosition" type="number" min="0" defaultValue={typeof dialog === "object" ? dialog.funnelPosition ?? "" : ""} />
                </label>
              </>
            )}
            <Notice error>{error}</Notice>
            <button className="button" disabled={busy}>
              Salvar
            </button>
            {typeof dialog === "object" && !dialog.isDefault && (
              <>
                <label>
                  Destino dos interessados ao excluir
                  <select name="destinationId">
                    <option value="">Escolha uma coluna</option>
                    {stages
                      .filter((s) => s.id !== dialog.id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="button danger"
                  disabled={busy}
                  onClick={(e) => {
                    const f = new FormData(e.currentTarget.form!);
                    void run(async () => {
                      await api(
                        `admin/stages/${dialog.id}`,
                        { destinationId: f.get("destinationId") || undefined },
                        "DELETE",
                      );
                      setDialog(null);
                    });
                  }}
                >
                  Excluir coluna e mover interessados
                </button>
              </>
            )}
          </form>
        </Modal>
      )}
    </section>
  );
}
