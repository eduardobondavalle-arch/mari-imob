"use client";
import { useCallback, useEffect, useState } from "react";
import { api, Modal, Notice } from "./ui";
import { Agenda } from "./agenda";
import { type Listing, priceLabel } from "@/lib/mari/types";
import { formatAppointment } from "@/lib/mari/time";
type Selection = {
  id: string;
  title: string;
  origin: string;
  publicToken: string;
  revision: number;
  items: Listing[];
};
type Comment = {
  id: string;
  text: string;
  author: { email: string };
  createdAt: string;
  updatedAt: string;
};
type Consultation = {
  id: string;
  answers: Record<string, string | string[]>;
  identityVerified: boolean;
  completedAt: string;
};
type Movement = {
  id: string;
  createdAt: string;
  fromStage: { name: string } | null;
  toStage: { name: string };
  author: { email: string } | null;
};
export function LeadExtras({
  lead,
}: {
  lead: { id: string; firstName: string; phone: string };
}) {
  const [data, setData] = useState<{
      comments: Comment[];
      selections: Selection[];
      consultations: Consultation[];
      movements: Movement[];
    }>({ comments: [], selections: [], consultations: [], movements: [] }),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [text, setText] = useState(""),
    [commentId, setCommentId] = useState<string | null>(null),
    [editing, setEditing] = useState<Selection | "new" | null>(null),
    [busy, setBusy] = useState(false);
  const load = useCallback(
    () =>
      api<typeof data>(`admin/lead-extras/${lead.id}`)
        .then(setData)
        .catch((e) => setError(e.message)),
    [lead.id],
  );
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);
  async function run(work: () => Promise<unknown>) {
    setError("");
    setBusy(true);
    try {
      await work();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="lead-extras">
      <Notice error>{error}</Notice>
      {data.consultations.length > 0 && (
        <section className="lead-profile">
          <p className="eyebrow">PERFIL DE BUSCA ENVIADO PELO SITE</p>
          <h3>Consultoria personalizada · {data.consultations.length} preenchimento(s)</h3>
          {data.consultations.map((consultation, index) => <details className="profile-version" key={consultation.id} open={index === 0}>
            <summary>{index === 0 ? "Perfil mais recente" : "Perfil anterior"} · {formatAppointment(consultation.completedAt)} · {consultation.identityVerified ? "identidade verificada" : "identidade não verificada"}</summary>
            <div className="profile-answers">
              {Object.entries(consultation.answers)
                .filter(([key, value]) => key !== "otherBudget" || value)
                .map(([key, value]) => (
                  <div key={key}>
                    <span>{({ objective: "Objetivo", regions: "Regiões", timing: "Momento", bedrooms: "Dormitórios", budget: "Investimento", otherBudget: "Outro valor", payment: "Pagamento" } as Record<string, string>)[key] || key}</span>
                    <strong>{Array.isArray(value) ? value.join(", ") : value}</strong>
                  </div>
                ))}
            </div>
          </details>)}
        </section>
      )}
      {data.movements.length > 0 && (
        <section className="lead-history">
          <h3>Histórico do funil</h3>
          {data.movements.map((movement) => (
            <p key={movement.id}>
              <strong>{movement.fromStage?.name || "Entrada"}</strong> → <strong>{movement.toStage.name}</strong>
              <small>{formatAppointment(movement.createdAt)}{movement.author ? ` · ${movement.author.email}` : ""}</small>
            </p>
          ))}
        </section>
      )}
      <h3>Comentários internos</h3>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await api(
              `admin/comments${commentId ? `/${commentId}` : ""}`,
              { leadId: lead.id, text },
              commentId ? "PUT" : "POST",
            );
            setText("");
            setCommentId(null);
          });
        }}
      >
        <label>
          Anotação
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            maxLength={5000}
          />
        </label>
        <div className="button-row">
          <button className="button small" disabled={busy}>
            {commentId ? "Salvar comentário" : "Adicionar comentário"}
          </button>
          {commentId && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setCommentId(null);
                setText("");
              }}
            >
              Cancelar edição
            </button>
          )}
        </div>
      </form>
      {data.comments.map((c) => (
        <article key={c.id} className="request-card">
          <p className="preserve-lines">{c.text}</p>
          <small>
            {c.author.email} · {formatAppointment(c.createdAt)}
            {c.updatedAt !== c.createdAt && " · editado"}
          </small>
          <div className="button-row">
            <button
              className="text-button"
              onClick={() => {
                setCommentId(c.id);
                setText(c.text);
              }}
            >
              Editar
            </button>
            <button
              className="text-button danger-text"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Excluir este comentário?"))
                  void run(() => api(`admin/comments/${c.id}`, {}, "DELETE"));
              }}
            >
              Excluir
            </button>
          </div>
        </article>
      ))}
      <Agenda leadId={lead.id} />
      <div className="admin-toolbar">
        <h3>Seleções para compartilhar</h3>
        <button className="button" onClick={() => setEditing("new")}>
          Criar seleção
        </button>
      </div>
      <p>
        Os links mostram apenas os imóveis. O nome e o telefone do interessado
        não são publicados.
      </p>
      <Notice>{message}</Notice>
      {data.selections.map((s) => (
        <article className="request-card" key={s.id}>
          <strong>{s.title}</strong>
          <p>
            {s.items.length} imóveis ·{" "}
            {s.origin === "client"
              ? "Escolhas do cliente"
              : "Preparada no painel"}
          </p>
          <div className="selection-mini-list">
            {s.items.map((p) => (
              <a
                key={p.id}
                href={`/imovel/${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {p.code} · {p.title} · {priceLabel(p.price)}
              </a>
            ))}
          </div>
          <div className="button-row">
            <a
              className="button small secondary"
              href={`/selecao/${s.publicToken}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visualizar seleção
            </a>
            <button
              className="button small secondary"
              onClick={async () => {
                const url = `${location.origin}/selecao/${s.publicToken}`;
                try {
                  await navigator.clipboard.writeText(url);
                  setMessage("Link copiado.");
                } catch {
                  setMessage(url);
                }
              }}
            >
              Copiar link
            </button>
            <button
              className="button small secondary"
              onClick={() =>
                window.open(
                  `https://wa.me/${lead.phone}?text=${encodeURIComponent(`Olá, ${lead.firstName}! Separei algumas opções de imóveis que podem combinar com o que você procura. Confira sua seleção personalizada: ${location.origin}/selecao/${s.publicToken}`)}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              Compartilhar no WhatsApp
            </button>
            {s.origin === "admin" && (
              <>
                <button className="text-button" onClick={() => setEditing(s)}>
                  Editar seleção
                </button>
                <button
                  className="text-button danger-text"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Excluir esta seleção? O link deixará de funcionar.",
                      )
                    )
                      void run(() =>
                        api(`admin/selections/${s.id}`, {}, "DELETE"),
                      );
                  }}
                >
                  Excluir seleção
                </button>
              </>
            )}
          </div>
        </article>
      ))}
      {editing && (
        <SelectionEditor
          leadId={lead.id}
          selection={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
function SelectionEditor({
  leadId,
  selection,
  onClose,
  onSaved,
}: {
  leadId: string;
  selection?: Selection;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [properties, setProperties] = useState<Listing[]>([]),
    [selected, setSelected] = useState(selection?.items.map((p) => p.id) || []),
    [q, setQ] = useState(""),
    [city, setCity] = useState(""),
    [purpose, setPurpose] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api<Listing[]>("admin/properties?status=published")
      .then(setProperties)
      .catch((e) => setError(e.message));
  }, []);
  const visible = properties.filter(
    (p) =>
      (!city || p.city === city) &&
      (!purpose || p.purpose === purpose) &&
      `${p.title} ${p.code} ${p.neighborhood}`
        .toLocaleLowerCase("pt-BR")
        .includes(q.toLocaleLowerCase("pt-BR")),
  );
  return (
    <Modal
      title={selection ? "Editar seleção" : "Nova seleção"}
      wide
      onClose={onClose}
    >
      <form
        className="modal-content stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setError("");
          try {
            await api(
              `admin/selections${selection ? `/${selection.id}` : ""}`,
              {
                leadId,
                title: f.get("title"),
                propertyIds: selected,
                revision: selection?.revision || 0,
              },
              selection ? "PUT" : "POST",
            );
            onSaved();
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Título público da seleção
          <input
            name="title"
            defaultValue={selection?.title || "Uma seleção especial"}
            required
            minLength={2}
            maxLength={80}
          />
        </label>
        <p>
          Use um título sem dados pessoais. O link público permanece o mesmo
          após editar.
        </p>
        <div className="form-grid">
          <label>
            Buscar imóvel
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Título, código ou bairro"
            />
          </label>
          <label>
            Cidade
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Todas</option>
              {[...new Set(properties.map((p) => p.city))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Finalidade
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="sale">Venda</option>
              <option value="rent">Locação</option>
            </select>
          </label>
        </div>
        <p>{selected.length} imóveis selecionados</p>
        <div className="property-picker">
          {visible.map((p) => (
            <label key={p.id}>
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={(e) =>
                  setSelected((ids) =>
                    e.target.checked
                      ? [...ids, p.id]
                      : ids.filter((id) => id !== p.id),
                  )
                }
              />
              <span>
                <strong>{p.title}</strong>
                <small>
                  {p.code} · {p.city} · {priceLabel(p.price)}
                </small>
              </span>
            </label>
          ))}
        </div>
        <Notice error>{error}</Notice>
        <button className="button" disabled={busy}>
          {busy ? "Salvando…" : "Salvar seleção"}
        </button>
      </form>
    </Modal>
  );
}
