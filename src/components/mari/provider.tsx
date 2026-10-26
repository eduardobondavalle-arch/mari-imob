"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, ArrowRight, ShieldCheck } from "lucide-react";
import { api, Modal, Notice } from "./ui";
import { contentSchema, normalizePhone } from "@/lib/mari/validation";
import {
  phoneMask,
  type ClientState,
  type Listing,
  type SiteContent,
} from "@/lib/mari/types";
type Intent = { kind: "register" | "contact" | "access"; property?: Listing };
type ContextValue = {
  content: SiteContent;
  client: ClientState;
  ready: boolean;
  refresh: () => Promise<void>;
  select: (property: Listing) => Promise<void>;
  openLogin: () => void;
  contact: (property?: Listing) => void;
  logout: () => Promise<void>;
};
const Context = createContext<ContextValue>(null!);
export const useMari = () => useContext(Context);
export function MariProvider({
  initialContent,
  children,
  exitProperties = [],
  presentation = false,
  demo = false,
}: {
  initialContent: SiteContent;
  children: React.ReactNode;
  exitProperties?: Listing[];
  presentation?: boolean;
  demo?: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  const [client, setClient] = useState<ClientState>(null);
  const [ready, setReady] = useState(false);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [error, setError] = useState("");
  const [presentationNotice, setPresentationNotice] = useState(false);
  const [exitCapture, setExitCapture] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  async function refresh() {
    try {
      setClient(await api<ClientState>("client"));
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    let live = true;
    api<ClientState>("client")
      .then((v) => {
        if (live) setClient(v);
      })
      .catch(() => {})
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (pathname !== "/editor-preview") return;
    const listener = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== window.parent ||
        e.data?.type !== "mari-preview"
      )
        return;
      const parsed = contentSchema.safeParse(e.data.content);
      if (parsed.success) setContent(parsed.data);
    };
    window.addEventListener("message", listener);
    window.parent.postMessage({ type: "mari-preview-ready" }, location.origin);
    return () => window.removeEventListener("message", listener);
  }, [pathname]);
  useEffect(() => {
    if (!ready || client || presentation || demo || intent || error || presentationNotice || exitCapture || !exitProperties.length) return;
    if (/^\/(?:admin|editor-preview|minha-selecao|selecao|privacidade)/.test(pathname)) return;
    if (sessionStorage.getItem("mari_exit_intent_seen")) return;
    let armed = false;
    let interacted = false;
    const armTimer = window.setTimeout(() => { armed = true; }, 8000);
    const mobileTimer = window.setTimeout(() => {
      if (interacted && window.matchMedia("(pointer: coarse)").matches) show();
    }, 45000);
    const show = () => {
      if (!armed && !window.matchMedia("(pointer: coarse)").matches) return;
      sessionStorage.setItem("mari_exit_intent_seen", "1");
      setExitCapture(true);
    };
    const onMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget && event.clientY <= 12) show();
    };
    const onInteract = () => { interacted = true; };
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("pointerdown", onInteract, { passive: true });
    document.addEventListener("scroll", onInteract, { passive: true });
    return () => {
      window.clearTimeout(armTimer);
      window.clearTimeout(mobileTimer);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("pointerdown", onInteract);
      document.removeEventListener("scroll", onInteract);
    };
  }, [client, demo, error, exitCapture, exitProperties, intent, pathname, presentation, presentationNotice, ready]);
  async function select(property: Listing) {
    if (presentation) {
      setPresentationNotice(true);
      return;
    }
    if (!client) {
      setIntent({ kind: "register", property });
      return;
    }
    try {
      await api(
        `selection/${property.id}?purpose=${property.purpose}`,
        {},
        client.items.some((i) => i.id === property.id) ? "DELETE" : "POST",
      );
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <Context.Provider
      value={{
        content,
        client,
        ready,
        refresh,
        select,
        openLogin: () => {
          if (presentation) setPresentationNotice(true);
          else if (client) router.push("/minha-selecao");
          else setIntent({ kind: "access" });
        },
        contact: (property) => presentation ? setPresentationNotice(true) : setIntent({ kind: "contact", property }),
        logout: async () => {
          await api("client/logout", {});
          setClient(null);
        },
      }}
    >
      <div
        style={
          {
            "--primary": content.primaryColor,
            "--accent": content.accentColor,
          } as React.CSSProperties
        }
      >
        {presentation && (
          <div style={{ padding: "9px 16px", textAlign: "center", background: "var(--primary)", color: "#fff", fontSize: 12, lineHeight: 1.5 }}>
            Prévia para avaliação · Imóveis ilustrativos · Cadastros desativados
          </div>
        )}
        {demo && (
          <div style={{ padding: "9px 16px", textAlign: "center", background: "var(--primary)", color: "#fff", fontSize: 12, lineHeight: 1.5 }}>
            Demonstração completa · Alterações salvas apenas nesta cópia · Use dados fictícios{" "}
            <Link href="/admin" style={{ color: "#fff", textDecoration: "underline", marginLeft: 8 }}>Painel administrativo</Link>
          </div>
        )}
        {children}
      </div>
      {presentationNotice && (
        <Modal title="Prévia para avaliação" onClose={() => setPresentationNotice(false)}>
          <div className="modal-content">
            <p>Explore os imóveis, os filtros e as galerias. Os cadastros, a seleção e as solicitações de contato estarão disponíveis na versão completa.</p>
            <p>Esta apresentação não coleta dados pessoais.</p>
          </div>
        </Modal>
      )}
      {intent && (
        <IdentityFlow
          intent={intent}
          onClose={() => setIntent(null)}
          onComplete={refresh}
        />
      )}{" "}
      {exitCapture && (
        <ExitCapture
          properties={exitProperties}
          onClose={() => setExitCapture(false)}
          onComplete={refresh}
        />
      )}
      {error && (
        <Modal title="Não foi possível concluir" onClose={() => setError("")}>
          <div className="modal-content">
            <Notice error>{error}</Notice>
          </div>
        </Modal>
      )}
    </Context.Provider>
  );
}

function ExitCapture({ properties, onClose, onComplete }: { properties: Listing[]; onClose: () => void; onComplete: () => Promise<void> }) {
  const [selected, setSelected] = useState(properties[0]);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("client/register", {
        firstName,
        phone: normalizePhone(phone),
        consent,
        propertyId: selected?.id,
        purpose: selected?.purpose,
      });
      await onComplete();
      setDone(true);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return <Modal title="Antes de ir…" wide onClose={onClose} className="exit-capture-modal">
    <div className="exit-capture">
      <div className="exit-capture-intro">
        <span className="eyebrow">UMA ÚLTIMA SELEÇÃO PARA VOCÊ</span>
        <h2>Puxa, não vai embora agora, seu novo imóvel pode estar aqui, deixa eu te chamar e te apresentar as melhores opções!</h2>
        <div className="exit-property-list">
          {properties.map((property) => {
            const image = property.images[0];
            return <button type="button" key={property.id} className={selected?.id === property.id ? "active" : ""} onClick={() => setSelected(property)} aria-pressed={selected?.id === property.id}>
              <span className="exit-property-image">{image ? <Image src={`/media/${image.key}`} alt={image.alt || property.title} fill sizes="110px" /> : <Heart size={22} />}</span>
              <span><strong>{property.title}</strong><small>{property.neighborhood} · {property.city}</small></span>
            </button>;
          })}
        </div>
      </div>
      <div className="exit-capture-form">
        {done ? <div className="exit-capture-success"><span className="round-icon"><Heart /></span><h2>Pronto, sua seleção foi criada!</h2><p>A Mari poderá chamar você no WhatsApp e apresentar as melhores opções.</p><button className="button full" onClick={onClose}>Continuar navegando</button></div> : <>
          <h3>Posso falar com você?</h3>
          <p>Deixe seu primeiro nome e WhatsApp. O imóvel escolhido ficará salvo na sua seleção.</p>
          <form className="stack" onSubmit={submit}>
            <label>Primeiro nome<input required minLength={2} maxLength={60} autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
            <label>Telefone com WhatsApp<input required type="tel" autoComplete="tel" placeholder="(47) 99999-9999" value={phone} onChange={(event) => setPhone(phoneMask(event.target.value))} /></label>
            <label className="check-line"><input required type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>Li a <Link href="/privacidade" target="_blank">política de privacidade</Link> e autorizo o contato sobre imóveis.</span></label>
            <Notice error>{error}</Notice>
            <button className="button full" disabled={busy}>{busy ? "Criando sua seleção…" : "Quero conhecer as melhores opções"}<ArrowRight size={18} /></button>
          </form>
        </>}
      </div>
    </div>
  </Modal>;
}
function IdentityFlow({
  intent,
  onClose,
  onComplete,
}: {
  intent: Intent;
  onClose: () => void;
  onComplete: () => Promise<void>;
}) {
  const step = intent.kind;
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const title =
    step === "contact"
      ? "Vamos conversar sobre seu próximo imóvel"
      : step === "register"
        ? "Seu próximo imóvel pode estar aqui!"
        : "Acesse sua seleção pelo telefone";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (step === "contact") {
        await api("contact", {
          firstName,
          phone: normalizePhone(phone),
          consent,
          propertyId: intent.property?.id,
          purpose: intent.property?.purpose,
          message,
        });
        setSuccess(true);
        return;
      }
      if (step === "access") {
        await api("client/recover", { phone: normalizePhone(phone) });
        await onComplete();
        onClose();
        return;
      }
      if (step === "register") {
        await api("client/register", {
          firstName,
          phone: normalizePhone(phone),
          consent,
          propertyId: intent.property?.id,
          purpose: intent.property?.purpose,
        });
      }
      await onComplete();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={step === "contact" ? "Solicitar contato" : "Minha Seleção"}
      onClose={onClose}
    >
      <div className="modal-content">
        <span className="round-icon">
          {step === "contact" ? <ArrowRight /> : <Heart />}
        </span>
        <h2>{success ? "Solicitação registrada" : title}</h2>
        {success ? (
          <>
            <p>
              A Mari poderá retornar pelo telefone informado. Sua solicitação já
              está disponível no atendimento.
            </p>
            <button className="button" onClick={onClose}>
              Concluir
            </button>
          </>
        ) : (
          <>
            <p>
              {step === "register"
                ? "Monte sua seleção para guardar suas opções favoritas, comparar imóveis e compartilhar com quem quiser."
                : step === "access"
                  ? "Informe o telefone usado para recuperar sua seleção neste dispositivo. O acesso mostra somente imóveis públicos do catálogo."
                : intent.property
                    ? `Seu interesse em ${intent.property.title} será registrado para atendimento.`
                    : "Conte o que você procura. A Mari poderá entrar em contato com você."}
            </p>
            <form className="stack" onSubmit={submit}>
              {step !== "access" && <label>
                  Primeiro nome
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={60}
                    autoComplete="given-name"
                  />
              </label>}
              <label>
                Telefone com WhatsApp
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(phoneMask(e.target.value))}
                  required
                  placeholder="(47) 99999-9999"
                  autoComplete="tel"
                />
              </label>
              {step === "contact" && (
                <label>
                  O que você procura? <small>(opcional)</small>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={3000}
                    rows={3}
                  />
                </label>
              )}
              {step !== "access" && <label className="check-line">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                  />
                  <span>
                    Li a{" "}
                    <Link href="/privacidade" target="_blank">
                      política de privacidade
                    </Link>{" "}
                    e autorizo o uso dos dados para{" "}
                    {step === "contact"
                      ? "responder à minha solicitação"
                      : "manter minha seleção e entrar em contato sobre os imóveis"}
                    .
                  </span>
              </label>}
              <Notice error>{error}</Notice>
              <button className="button full" disabled={busy}>
                {busy
                  ? "Aguarde…"
                  : step === "register"
                    ? "Criar minha seleção"
                    : step === "access"
                      ? "Acessar minha seleção"
                      : "Confirmar solicitação"}
                <ArrowRight size={18} />
              </button>
            </form>
            <p className="privacy-note">
              <ShieldCheck size={15} /> {step === "access"
                ? "O telefone identifica uma seleção de conveniência; ele não verifica identidade nem libera dados do atendimento."
                : "Seus dados ficam protegidos."}
            </p>
            <Link
              className="admin-access"
              href="/admin/login"
              onClick={onClose}
            >
              Acesso administrativo
            </Link>
          </>
        )}
      </div>
    </Modal>
  );
}
