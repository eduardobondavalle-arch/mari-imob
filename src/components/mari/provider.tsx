"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ArrowRight, ShieldCheck } from "lucide-react";
import { api, Modal, Notice } from "./ui";
import { contentSchema, normalizePhone } from "@/lib/mari/validation";
import {
  phoneMask,
  type ClientState,
  type Listing,
  type SiteContent,
} from "@/lib/mari/types";
type Intent = { kind: "register" | "contact"; property?: Listing };
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
  presentation = false,
  demo = false,
}: {
  initialContent: SiteContent;
  children: React.ReactNode;
  presentation?: boolean;
  demo?: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  const [client, setClient] = useState<ClientState>(null);
  const [ready, setReady] = useState(false);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [error, setError] = useState("");
  const [presentationNotice, setPresentationNotice] = useState(false);
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
        `selection/${property.id}`,
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
          else setIntent({ kind: "register" });
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
function IdentityFlow({
  intent,
  onClose,
  onComplete,
}: {
  intent: Intent;
  onClose: () => void;
  onComplete: () => Promise<void>;
}) {
  const { client } = useMari();
  const step = intent.kind;
  const [firstName, setFirstName] = useState(client?.firstName || "");
  const [phone, setPhone] = useState(phoneMask(client?.phone || ""));
  const [consent, setConsent] = useState(false);
  const [recoveryRequired, setRecoveryRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const title =
    step === "contact"
      ? "Vamos conversar sobre seu próximo imóvel"
      : step === "register"
        ? "Seu próximo imóvel pode estar aqui!"
        : "Que bom ter você por aqui";
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
          message,
        });
        setSuccess(true);
        return;
      }
      if (step === "register") {
        const result = await api<{ recoveryRequired?: boolean }>(
          "client/register",
          {
            firstName,
            phone: normalizePhone(phone),
            consent,
            propertyId: intent.property?.id,
          },
        );
        if (result.recoveryRequired) {
          setRecoveryRequired(true);
          return;
        }
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
                : intent.property
                    ? `Seu interesse em ${intent.property.title} será registrado para atendimento.`
                    : "Conte o que você procura. A Mari poderá entrar em contato com você."}
            </p>
            <form className="stack" onSubmit={submit}>
              <label>
                  Primeiro nome
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={60}
                    autoComplete="given-name"
                  />
              </label>
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
              <label className="check-line">
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
              </label>
              <Notice error>{error}</Notice>
              {recoveryRequired && (
                <Notice>
                  Este telefone já possui um cadastro. Por segurança, os dados
                  e imóveis salvos não são liberados apenas com o número.
                  Fale com a Mari para recuperar o acesso.
                </Notice>
              )}
              <button className="button full" disabled={busy}>
                {busy
                  ? "Aguarde…"
                  : step === "register"
                    ? "Criar minha seleção"
                    : "Confirmar solicitação"}
                <ArrowRight size={18} />
              </button>
            </form>
            <p className="privacy-note">
              <ShieldCheck size={15} /> Seus dados ficam protegidos.
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
