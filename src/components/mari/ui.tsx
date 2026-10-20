"use client";
import { useEffect, useRef, useState } from "react";
import { X, LoaderCircle, Upload } from "lucide-react";
import Image from "next/image";
export class ApiError extends Error {
  constructor(message: string, public status: number, public details: Record<string, unknown>) { super(message); }
}
export async function api<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({ error: "A sessão da apresentação expirou. Abra novamente o link de acesso." }));
  if (!response.ok) throw new ApiError(data.error || "Não foi possível concluir.", response.status, data);
  return data;
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`m-modal ${wide ? "m-modal-wide" : ""} ${className}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-bar">
        <span>{title}</span>
        <button
          className="icon-button"
          aria-label="Fechar janela"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return children ? (
    <p
      className={`notice ${error ? "notice-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </p>
  ) : null;
}
export function Busy() {
  return (
    <span className="busy" role="status">
      <LoaderCircle className="spin" size={20} /> Carregando…
    </span>
  );
}
export function MediaUpload({
  onUploaded,
  multiple = false,
}: {
  onUploaded: (media: {
    id: string;
    key: string;
    url: string;
    alt: string;
    width: number;
    height: number;
    position: number;
  }) => void;
  multiple?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <label className={`upload-box ${busy ? "disabled" : ""}`}>
        <Upload size={21} />
        <span>
          {busy
            ? "Enviando imagens…"
            : multiple
              ? "Adicionar fotos"
              : "Enviar imagem"}
          <small>JPG, PNG, WebP ou AVIF · até 8 MB</small>
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={multiple}
          disabled={busy}
          onChange={async (e) => {
            const files = [...(e.target.files || [])];
            setBusy(true);
            setError("");
            try {
              for (const file of files) {
                if (file.size > 8 * 1024 * 1024)
                  throw new Error(`${file.name}: tamanho máximo de 8 MB.`);
                const form = new FormData();
                form.set("file", file);
                const res = await fetch("/api/admin/upload", {
                  method: "POST",
                  body: form,
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error);
                onUploaded(result);
              }
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
      </label>
      <Notice error>{error}</Notice>
    </div>
  );
}
export function Picture({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`picture ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 700px) 100vw, 60vw"
        priority={priority}
      />
    </div>
  );
}
