"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Building2,
  Users,
  Paintbrush,
  Settings,
  Plus,
  Star,
  Pencil,
  Trash2,
  ExternalLink,
  LogOut,
  Search,
  ArrowLeft,
} from "lucide-react";
import { api, Busy, Modal, Notice } from "./ui";
import { PropertyEditor } from "./property-editor";
import { Configuration } from "./configuration";
import { SiteEditor } from "./site-editor";
import {
  type Listing,
  priceLabel,
  statuses,
  phoneMask,
} from "@/lib/mari/types";
import { PropertyGrid } from "./property";
import { CrmBoard } from "./crm-board";
import { Agenda } from "./agenda";
import { LeadExtras } from "./lead-extras";
import { OwnerSubmissionsAdmin } from "./owner-submissions-admin";
import { NewsAdmin } from "./news-admin";
import { FunnelAdmin } from "./funnel-admin";
import { CondominiumAdmin } from "./condominium-admin";
const tabs = [
  { id: "overview", label: "Visão geral", Icon: LayoutDashboard },
  { id: "properties", label: "Imóveis", Icon: Building2 },
  { id: "condominiums", label: "Condomínios", Icon: Building2 },
  { id: "leads", label: "Interessados", Icon: Users },
  { id: "funnel", label: "Funil", Icon: LayoutDashboard },
  { id: "owners", label: "Captações", Icon: Building2 },
  { id: "agenda", label: "Agenda", Icon: CalendarDays },
  { id: "news", label: "Notícias", Icon: Paintbrush },
  { id: "editor", label: "Editor do site", Icon: Paintbrush },
  { id: "settings", label: "Configurações", Icon: Settings },
];
type LeadRow = {
  id: string;
  firstName: string;
  phone: string;
  source: string;
  createdAt: string;
  lastActivityAt: string;
  selection: { _count: { items: number } } | null;
  _count: { requests: number };
};
type LeadDetail = LeadRow & {
  items: Listing[];
  requests: {
    id: string;
    status: string;
    message: string;
    createdAt: string;
    property: { title: string; code: string; slug: string } | null;
  }[];
};
type Dashboard = {
  total: number;
  published: number;
  featured: number;
  leads: number;
  newLeads: number;
  latest: {
    id: string;
    firstName: string;
    source: string;
    createdAt: string;
  }[];
};
export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <Link href="/" className="admin-brand">
          <Image
            src="/brand/mari-imob-horizontal.webp"
            alt="Mari Imob Corretora de Imóveis"
            width={300}
            height={91}
            priority
          />
        </Link>
        <p className="eyebrow">ACESSO ADMINISTRATIVO</p>
        <h1>Bem-vinda de volta.</h1>
        <p>Seu site e seus atendimentos, em um só lugar.</p>
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const form = new FormData(e.currentTarget);
            try {
              await api("admin/login", {
                email: form.get("email"),
                password: form.get("password"),
              });
              router.push("/admin");
              router.refresh();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            E-mail
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <Notice error>{error}</Notice>
          <button className="button full" disabled={busy}>
            {busy ? "Entrando…" : "Entrar no painel"}
          </button>
        </form>
        <Link className="back-link" href="/">
          <ArrowLeft size={15} /> Voltar ao site
        </Link>
      </div>
    </div>
  );
}
export function AdminPanel({
  mustChangePassword,
  production,
}: {
  mustChangePassword: boolean;
  production: boolean;
}) {
  const query = useSearchParams();
  const tab = tabs.some((t) => t.id === query.get("tab"))
    ? query.get("tab")!
    : "overview";
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [properties, setProperties] = useState<Listing[]>([]);
  const [overview, setOverview] = useState<Dashboard | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Listing | "new" | null>(null);
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [deleting, setDeleting] = useState<{
    kind: "properties" | "leads";
    id: string;
    name: string;
  } | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(mustChangePassword);
  const load = useCallback(async () => {
    if (production && passwordRequired) {
      setBusy(false);
      return;
    }
    try {
      setError("");
      if (tab === "overview")
        setOverview(await api<Dashboard>("admin/dashboard"));
      if (tab === "properties")
        setProperties(
          await api<Listing[]>(
            `admin/properties?q=${encodeURIComponent(q)}&status=${status}`,
          ),
        );
      if (tab === "leads") {
        if (lead) setLead(await api<LeadDetail>(`admin/leads/${lead.id}`));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, [tab, q, status, production, passwordRequired, lead?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(load, 200);
    const refresh = setInterval(load, 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(refresh);
    };
  }, [load]);
  async function action(fn: () => Promise<unknown>) {
    try {
      await fn();
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <Image
            src="/brand/mari-imob-horizontal.webp"
            alt="Mari Imob Corretora de Imóveis"
            width={300}
            height={91}
            priority
          />
        </Link>
        <span className="sidebar-caption">SEU ESPAÇO DE GESTÃO</span>
        <nav aria-label="Administração">
          {tabs.map(({ id, label, Icon }) => (
            <Link
              href={`/admin?tab=${id}`}
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setQ("");
                setStatus("");
                setEditing(null);
                setMessage("");
              }}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank">
            Visualizar site <ExternalLink size={16} />
          </Link>
          <button
            onClick={() =>
              action(async () => {
                await api("admin/logout", {});
                router.replace("/admin/login");
                router.refresh();
              })
            }
          >
            <LogOut size={17} /> Sair do painel
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span>
            Administração <span>/ {tabs.find((t) => t.id === tab)?.label}</span>
          </span>
          <span className="admin-avatar">M</span>
        </header>
        <main className="admin-content">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TUDO NO SEU TEMPO</p>
              <h1>
                {editing
                  ? editing === "new"
                    ? "Novo imóvel"
                    : "Editar imóvel"
                  : tabs.find((t) => t.id === tab)?.label}
              </h1>
              <p>
                {tab === "overview"
                  ? "Um olhar simples sobre seus imóveis e seus próximos atendimentos."
                  : tab === "properties"
                    ? "Organize o catálogo e escolha o que aparece no site."
                    : tab === "leads"
                      ? "Conheça quem está procurando um novo lugar."
                      : tab === "editor"
                        ? "Sua identidade, com liberdade para atualizar."
                        : "Personalize os dados dos imóveis e proteja seu acesso."}
              </p>
            </div>
            {tab === "properties" && !editing && (
              <button className="button" onClick={() => setEditing("new")}>
                <Plus size={17} /> Cadastrar imóvel
              </button>
            )}
          </div>
          <Notice error>{error}</Notice>
          <Notice>{message}</Notice>
          {passwordRequired && (
            <Notice>
              Altere a senha temporária{" "}
              {production
                ? "para liberar o painel"
                : "antes de colocar o site em produção"}
              . <Link href="/admin?tab=settings">Configurar senha</Link>
            </Notice>
          )}
          {production && passwordRequired ? (
            <PasswordForm onSaved={() => setPasswordRequired(false)} />
          ) : (
            <>
              {busy && ["overview", "properties", "leads"].includes(tab) ? (
                <Busy />
              ) : null}
              {tab === "overview" && overview && (
                <>
                  <div className="metrics">
                    {[
                      ["Total de imóveis", overview.total],
                      ["Publicados", overview.published],
                      ["Em destaque", overview.featured],
                      ["Interessados", overview.leads],
                      ["Novos em 7 dias", overview.newLeads],
                    ].map(([label, value]) => (
                      <div className="metric" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="admin-card">
                    <h2>Últimos interessados</h2>
                    {overview.latest.length ? (
                      <div className="simple-list">
                        {overview.latest.map((l) => (
                          <button
                            key={l.id}
                            onClick={() =>
                              action(async () =>
                                setLead(
                                  await api<LeadDetail>(`admin/leads/${l.id}`),
                                ),
                              )
                            }
                          >
                            <span>
                              {l.firstName}
                              <small>{l.source}</small>
                            </span>
                            <span>
                              {new Date(l.createdAt).toLocaleDateString(
                                "pt-BR",
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p>Os novos contatos e seleções aparecerão aqui.</p>
                    )}
                  </div>
                  <div className="admin-welcome">
                    <Building2 size={34} strokeWidth={1} />
                    <div>
                      <h2>Uma boa apresentação começa pelo seu catálogo.</h2>
                      <p>
                        Cadastre fotos, detalhes e valores. Publique quando
                        estiver tudo pronto.
                      </p>
                    </div>
                    <Link
                      href="/admin?tab=properties"
                      className="button secondary"
                    >
                      Gerenciar imóveis
                    </Link>
                  </div>
                </>
              )}
              {tab === "properties" &&
                (editing ? (
                  <PropertyEditor
                    property={editing === "new" ? null : editing}
                    onCancel={() => setEditing(null)}
                    onSaved={async () => {
                      setEditing(null);
                      setMessage("Imóvel salvo com sucesso.");
                      await load();
                    }}
                  />
                ) : (
                  <>
                    <div className="admin-toolbar">
                      <label className="search-input">
                        <Search size={17} />
                        <input
                          aria-label="Buscar imóveis"
                          placeholder="Buscar por título ou código"
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                        />
                      </label>
                      <select
                        aria-label="Filtrar status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="">Todos os status</option>
                        {Object.entries(statuses).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-card table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Imóvel</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Destaques</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {properties.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <strong>{p.title}</strong>
                                <small>
                                  {p.code} · {p.city}
                                </small>
                              </td>
                              <td>{priceLabel(p.price)}</td>
                              <td>
                                <select
                                  aria-label={`Status de ${p.code}`}
                                  value={p.status}
                                  onChange={(e) =>
                                    action(() =>
                                      api(
                                        `admin/properties/${p.id}`,
                                        { status: e.target.value },
                                        "PATCH",
                                      ),
                                    )
                                  }
                                >
                                  {Object.entries(statuses).map(
                                    ([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </td>
                              <td>
                                <div className="row-actions">
                                  <button className={`icon-button ${p.featured ? "star-active" : ""}`} title="Destaque" aria-label={`Destaque de ${p.code}`} aria-pressed={p.featured} onClick={() => action(() => api(`admin/properties/${p.id}`, { featured: !p.featured }, "PATCH"))}>
                                    <Star size={19} fill={p.featured ? "currentColor" : "none"} />
                                  </button>
                                  <button className={`icon-button super-star ${p.superFeatured ? "star-active" : ""}`} title="Super destaque" aria-label={`Super destaque de ${p.code}`} aria-pressed={p.superFeatured} onClick={() => action(() => api(`admin/properties/${p.id}`, { superFeatured: !p.superFeatured }, "PATCH"))}>
                                    <Star size={19} fill={p.superFeatured ? "currentColor" : "none"} />
                                  </button>
                                </div>
                              </td>
                              <td>
                                <div className="row-actions">
                                  <button
                                    className="icon-button"
                                    aria-label={`Editar ${p.code}`}
                                    onClick={() => setEditing(p)}
                                  >
                                    <Pencil size={17} />
                                  </button>
                                  {p.status === "published" && (
                                    <Link
                                      className="icon-button"
                                      aria-label={`Visualizar ${p.code}`}
                                      href={`/imovel/${p.slug}`}
                                      target="_blank"
                                    >
                                      <ExternalLink size={17} />
                                    </Link>
                                  )}
                                  <button
                                    className="icon-button danger-text"
                                    aria-label={`Excluir ${p.code}`}
                                    onClick={() =>
                                      setDeleting({
                                        kind: "properties",
                                        id: p.id,
                                        name: p.title,
                                      })
                                    }
                                  >
                                    <Trash2 size={17} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!properties.length && (
                        <div className="empty-admin">
                          Nenhum imóvel cadastrado nesta busca.
                        </div>
                      )}
                    </div>
                  </>
                ))}
              {tab === "leads" && <CrmBoard onOpen={id => action(async () => setLead(await api<LeadDetail>(`admin/leads/${id}`)))}/>}
              {tab === "condominiums" && <CondominiumAdmin />}
              {tab === "funnel" && <FunnelAdmin />}
              {tab === "owners" && <OwnerSubmissionsAdmin />}
              {tab === "agenda" && <Agenda/>}
              {tab === "news" && <NewsAdmin />}
              {tab === "editor" && <SiteEditor />}
              {tab === "settings" && (
                <>
                  <Configuration />
                  <PasswordForm onSaved={() => setPasswordRequired(false)} />
                </>
              )}
            </>
          )}
        </main>
      </div>
      {lead && (
        <Modal
          title="Detalhes do interessado"
          wide
          onClose={() => setLead(null)}
        >
          <div className="modal-content">
            <p className="eyebrow">INTERESSADO</p>
            <h2>{lead.firstName}</h2>
            <p>
              {phoneMask(lead.phone)} · Cadastro em{" "}
              {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
            </p>
            <p>Origem: {lead.source}</p>
            <a
              className="button secondary"
              href={`https://wa.me/${lead.phone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir conversa no WhatsApp
            </a>
            <LeadExtras lead={lead}/>
            <h3>Imóveis selecionados pelo cliente</h3>
            {lead.items.length ? (
              <PropertyGrid items={lead.items} />
            ) : (
              <p>Nenhum imóvel selecionado.</p>
            )}
            <h3>Solicitações de contato</h3>
            {lead.requests.map((r) => (
              <div className="request-card" key={r.id}>
                <strong>
                  {r.property
                    ? `${r.property.title} · ${r.property.code}`
                    : "Contato geral"}
                </strong>
                <small>{new Date(r.createdAt).toLocaleString("pt-BR")}</small>
                <p>{r.message || "Solicitou contato sobre este imóvel."}</p>
                <button
                  className="button small secondary"
                  disabled={r.status === "handled"}
                  onClick={() =>
                    action(async () => {
                      await api(
                        `admin/requests/${r.id}`,
                        { status: "handled" },
                        "PATCH",
                      );
                      setLead(await api<LeadDetail>(`admin/leads/${lead.id}`));
                    })
                  }
                >
                  {r.status === "handled"
                    ? "Atendimento registrado"
                    : "Marcar como atendido"}
                </button>
              </div>
            ))}
            <button
              className="text-button danger-text"
              onClick={() => {
                setDeleting({
                  kind: "leads",
                  id: lead.id,
                  name: lead.firstName,
                });
                setLead(null);
              }}
            >
              Excluir dados do interessado
            </button>
          </div>
        </Modal>
      )}
      {deleting && (
        <Modal title="Confirmar exclusão" onClose={() => setDeleting(null)}>
          <div className="modal-content">
            <h2>Excluir {deleting.name}?</h2>
            <p>
              Esta ação remove o registro e os vínculos associados. Não é
              possível desfazer.
            </p>
            <button
              className="button danger"
              onClick={() =>
                action(async () => {
                  await api(
                    `admin/${deleting.kind}/${deleting.id}`,
                    {},
                    "DELETE",
                  );
                  setDeleting(null);
                })
              }
            >
              Confirmar exclusão
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function PasswordForm({ onSaved }: { onSaved: () => void }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="admin-card password-card">
      <h2>Segurança do acesso</h2>
      <p>Use uma senha exclusiva com pelo menos 12 caracteres.</p>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          setBusy(true);
          setError("");
          try {
            await api("admin/password", {
              currentPassword: data.get("currentPassword"),
              password: data.get("password"),
            });
            setMessage(
              "Senha alterada. Outras sessões administrativas foram encerradas.",
            );
            form.reset();
            onSaved();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Senha atual
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          Nova senha
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
          />
        </label>
        <Notice error>{error}</Notice>
        <Notice>{message}</Notice>
        <button className="button" disabled={busy}>
          {busy ? "Salvando…" : "Alterar senha"}
        </button>
      </form>
    </section>
  );
}
