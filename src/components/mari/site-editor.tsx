"use client";
import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone, Eye, Save, Upload, Pencil } from "lucide-react";
import { api, Busy, MediaUpload, Notice, Modal } from "./ui";
import type { SiteContent } from "@/lib/mari/types";
import { defaultContent } from "@/lib/mari/defaults";
const groups: { id: string; label: string; keys: (keyof SiteContent)[] }[] = [
  {
    id: "brand",
    label: "Identidade e cores",
    keys: ["brandName", "logo", "favicon", "primaryColor", "accentColor"],
  },
  {
    id: "hero",
    label: "Banner principal",
    keys: ["heroImage", "heroTitle", "heroSubtitle"],
  },
  { id: "featured", label: "Imóveis em destaque", keys: ["featuredTitle"] },
  {
    id: "about",
    label: "Apresentação da Mari",
    keys: ["aboutEyebrow", "aboutTitle", "aboutText", "aboutImage", "aboutButtonText", "aboutButtonUrl"],
  },
  {
    id: "contact",
    label: "Contato e redes sociais",
    keys: ["contactTitle", "whatsapp", "whatsappPhoto", "whatsappMessage", "whatsappEnabled", "instagram", "facebook", "youtube", "linkedin"],
  },
  {
    id: "footer",
    label: "Rodapé e dados profissionais",
    keys: ["footerText", "professionalInfo", "creci"],
  },
];
const labels: Record<keyof SiteContent, string> = {
  brandName: "Nome da marca",
  logo: "Logotipo",
  favicon: "Favicon",
  primaryColor: "Cor principal",
  accentColor: "Cor de destaque",
  heroImage: "Imagem do banner",
  heroTitle: "Título do banner",
  heroSubtitle: "Subtítulo",
  featuredTitle: "Título dos destaques",
  aboutTitle: "Título da apresentação",
  aboutEyebrow: "Subtítulo da apresentação",
  aboutText: "Texto de apresentação",
  aboutImage: "Foto de apresentação",
  aboutButtonText: "Texto do botão",
  aboutButtonUrl: "Destino do botão",
  contactTitle: "Título do contato",
  footerText: "Texto do rodapé",
  whatsapp: "WhatsApp com DDI e DDD",
  whatsappPhoto: "Foto do botão do WhatsApp",
  whatsappMessage: "Mensagem padrão do WhatsApp",
  whatsappEnabled: "Exibir botão do WhatsApp",
  instagram: "Link do Instagram",
  facebook: "Link do Facebook",
  youtube: "Link do YouTube",
  linkedin: "Link do LinkedIn",
  creci: "CRECI (somente se informado)",
  professionalInfo: "Informações profissionais",
};
export function SiteEditor() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [revision, setRevision] = useState(0);
  const [group, setGroup] = useState("hero");
  const [mobile, setMobile] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [discard, setDiscard] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    api<{
      content: {
        published: SiteContent;
        draft: SiteContent | null;
        revision: number;
      };
    }>("admin/settings")
      .then((data) => {
        setContent({
          ...defaultContent,
          ...(data.content.draft || data.content.published),
        });
        setRevision(data.content.revision);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (content)
      frame.current?.contentWindow?.postMessage(
        { type: "mari-preview", content },
        location.origin,
      );
  }, [content]);
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin === location.origin && e.source === frame.current?.contentWindow && e.data?.type === "mari-preview-ready" && content) {
        frame.current?.contentWindow?.postMessage({ type: "mari-preview", content }, location.origin);
      }
      if (
        e.origin === location.origin &&
        e.source === frame.current?.contentWindow &&
        e.data?.type === "mari-edit" &&
        groups.some((g) => g.id === e.data.group)
      )
        setGroup(e.data.group);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [content]);
  async function save(action: "draft" | "publish" | "discard") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ revision: number }>("admin/content", {
        action,
        content,
        revision,
      });
      setRevision(result.revision);
      if (action === "discard") {
        const data = await api<{ content: { published: SiteContent } }>(
          "admin/settings",
        );
        setContent(data.content.published);
        setDiscard(false);
      }
      setMessage(
        action === "publish"
          ? "Alterações publicadas. O site já utiliza o novo conteúdo."
          : action === "draft"
            ? "Rascunho salvo. O site público continua com a versão publicada."
            : "Alterações descartadas.",
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!content)
    return (
      <>
        <Busy />
        <Notice error>{error}</Notice>
      </>
    );
  return (
    <>
      <div className="editor-toolbar">
        <div className="button-row">
          <button
            className={`icon-button ${!mobile ? "selected" : ""}`}
            aria-label="Prévia desktop"
            onClick={() => setMobile(false)}
          >
            <Monitor size={20} />
          </button>
          <button
            className={`icon-button ${mobile ? "selected" : ""}`}
            aria-label="Prévia mobile"
            onClick={() => setMobile(true)}
          >
            <Smartphone size={20} />
          </button>
          <button
            className="text-button"
            onClick={() =>
              frame.current?.contentWindow?.postMessage(
                { type: "mari-preview", content },
                location.origin,
              )
            }
          >
            <Eye size={16} /> Visualizar alterações
          </button>
        </div>
        <div className="button-row">
          <button
            className="text-button"
            disabled={busy}
            onClick={() => setDiscard(true)}
          >
            Descartar
          </button>
          <button
            className="button secondary small"
            disabled={busy}
            onClick={() => save("draft")}
          >
            <Save size={15} /> Salvar rascunho
          </button>
          <button
            className="button small"
            disabled={busy}
            onClick={() => save("publish")}
          >
            <Upload size={15} /> Publicar alterações
          </button>
        </div>
      </div>
      <Notice error>{error}</Notice>
      <Notice>{message}</Notice>
      <div className="visual-editor">
        <div className="preview-stage">
          <iframe
            ref={frame}
            src="/editor-preview"
            title="Prévia editável do site"
            className={mobile ? "mobile-preview" : ""}
            onLoad={() =>
              frame.current?.contentWindow?.postMessage(
                { type: "mari-preview", content },
                location.origin,
              )
            }
          />
        </div>
        <aside className="editor-inspector">
          <p className="eyebrow">CLIQUE EM UMA REGIÃO DA PRÉVIA</p>
          <nav aria-label="Seções do editor">
            {groups.map((g) => (
              <button
                className={group === g.id ? "active" : ""}
                key={g.id}
                onClick={() => setGroup(g.id)}
              >
                <Pencil size={13} />
                {g.label}
              </button>
            ))}
          </nav>
          <div className="stack">
            {groups
              .find((g) => g.id === group)
              ?.keys.map((key) =>
                ["logo", "favicon", "heroImage", "aboutImage", "whatsappPhoto"].includes(key) ? (
                  <div key={key}>
                    <label>{labels[key]}</label>
                    {content[key] && (
                      <p className="image-path">
                        Imagem configurada{" "}
                        <button
                          className="text-button"
                          onClick={() =>
                            setContent((c) => ({ ...c!, [key]: "" }))
                          }
                        >
                          Remover
                        </button>
                      </p>
                    )}
                    <MediaUpload
                      onUploaded={(image) =>
                        setContent((c) => ({ ...c!, [key]: image.url }))
                      }
                    />
                  </div>
                ) : (
                  <label key={key}>
                    {labels[key]}
                    {key === "whatsappEnabled" ? (
                      <input
                        type="checkbox"
                        checked={content[key]}
                        onChange={(e) => setContent((c) => ({ ...c!, [key]: e.target.checked }))}
                      />
                    ) : key.includes("Color") ? (
                      <input
                        type="color"
                        value={content[key]}
                        onChange={(e) =>
                          setContent((c) => ({ ...c!, [key]: e.target.value }))
                        }
                      />
                    ) : [
                        "aboutText",
                        "heroTitle",
                        "heroSubtitle",
                        "aboutTitle",
                        "footerText",
                      ].includes(key) ? (
                      <textarea
                        rows={key === "aboutText" ? 7 : 3}
                        value={content[key]}
                        onChange={(e) =>
                          setContent((c) => ({ ...c!, [key]: e.target.value }))
                        }
                      />
                    ) : (
                      <input
                        value={content[key]}
                        onChange={(e) =>
                          setContent((c) => ({ ...c!, [key]: e.target.value }))
                        }
                      />
                    )}
                  </label>
                ),
              )}
          </div>
        </aside>
      </div>
      {discard && (
        <Modal title="Descartar alterações" onClose={() => setDiscard(false)}>
          <div className="modal-content">
            <h2>Voltar à versão publicada?</h2>
            <p>O rascunho e as alterações desta tela serão descartados.</p>
            <button className="button" onClick={() => save("discard")}>
              Descartar alterações
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
