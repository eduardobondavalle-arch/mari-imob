"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Copy, Mail, MessageCircle } from "lucide-react";
import { site } from "@/config/site";
import { draftMessage, whatsappLink } from "@/lib/contact";
export function ContactForm() {
  const [prepared, setPrepared] = useState(""),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  return (
    <div className="contact-form-card">
      <span className="eyebrow">Vamos encontrar seu lugar</span>
      <h2>Conte com a gente.</h2>
      <p>
        A mensagem será aberta no WhatsApp ou no seu aplicativo de email. Você
        confere e envia por lá.
      </p>
      <form
        onChange={() => {
          setPrepared("");
          setError("");
          setCopied(false);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const d = {
            name: String(f.get("name") || ""),
            email: String(f.get("email") || ""),
            phone: String(f.get("phone") || ""),
            message: String(f.get("message") || ""),
          };
          if (!d.name.trim() || !d.message.trim()) {
            setError("Preencha seu nome e a mensagem.");
            return;
          }
          if (!d.email.trim() && !d.phone.trim()) {
            setError("Informe email ou telefone para retorno.");
            return;
          }
          if (d.phone && d.phone.replace(/\D/g, "").length < 10) {
            setError("Informe um telefone com DDD.");
            return;
          }
          setError("");
          setPrepared(draftMessage(d));
        }}
      >
        <label>
          Seu nome
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="Como podemos chamar você?"
          />
        </label>
        <div className="form-row">
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={120}
              placeholder="voce@email.com"
            />
          </label>
          <label>
            Telefone com DDD
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={25}
              placeholder="(47) 99999-9999"
            />
          </label>
        </div>
        <span className="field-hint">
          Informe pelo menos um canal para retorno.
        </span>
        <label>
          Sua mensagem
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={1800}
            rows={5}
            placeholder="Conte o que você procura ou como podemos ajudar."
          />
        </label>
        <p className="privacy-note">
          Seus dados serão incluídos na mensagem que você escolher enviar.
          Consulte a <Link href="/privacidade">política de privacidade</Link>.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button-dark" type="submit">
          Preparar minha mensagem <ArrowUpRight size={18} />
        </button>
      </form>
      {prepared && (
        <div className="prepared-message" role="status">
          <h3>Mensagem pronta para você enviar.</h3>
          <p>
            Destino: Adim Aluguéis. O envio acontece no aplicativo escolhido.
          </p>
          <div>
            <a
              className="button button-orange"
              href={whatsappLink(prepared)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={17} /> Continuar no WhatsApp
            </a>
            <a
              className="button button-outline"
              href={`mailto:${site.email}?subject=${encodeURIComponent("Contato pelo site Adim")}&body=${encodeURIComponent(prepared)}`}
            >
              <Mail size={17} /> Abrir email
            </a>
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(prepared);
                  setCopied(true);
                } catch {
                  setError(
                    "Não foi possível copiar. Selecione a mensagem abaixo para copiar manualmente.",
                  );
                }
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
              {copied ? "Mensagem copiada" : "Copiar mensagem"}
            </button>
          </div>
          <details>
            <summary>Conferir mensagem</summary>
            <pre>{prepared}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
