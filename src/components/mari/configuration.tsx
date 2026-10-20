"use client";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, Busy, Modal, Notice } from "./ui";
import { type Field, type FieldType, fieldTypes } from "@/lib/mari/types";
import type { SettingsData } from "./property-editor";
export function Configuration() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Field | "new" | null>(null);
  const [remove, setRemove] = useState<{ path: string; label: string } | null>(
    null,
  );
  async function load() {
    setData(await api<SettingsData>("admin/settings"));
  }
  useEffect(() => {
    api<SettingsData>("admin/settings")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  if (!data)
    return (
      <>
        <Busy />
        <Notice error>{error}</Notice>
      </>
    );
  return (
    <>
      <Notice error>{error}</Notice>
      <section className="admin-card">
        <div className="section-heading">
          <div>
            <h2>Campos dos imóveis</h2>
            <p>
              Os campos essenciais são preservados. Personalize as informações
              adicionais.
            </p>
          </div>
          <button
            className="button secondary"
            onClick={() => setEditing("new")}
          >
            <Plus size={16} /> Adicionar campo
          </button>
        </div>
        <div className="simple-list">
          {data.fields.map((f) => (
            <div className="config-row" key={f.id}>
              <div>
                <strong>{f.label}</strong>
                <small>
                  {fieldTypes[f.type]} ·{" "}
                  {f.required ? "Obrigatório" : "Opcional"} ·{" "}
                  {f.public ? "Público" : "Privado"}
                  {f.filterable ? " · Filtro de busca" : ""}
                </small>
              </div>
              <div className="row-actions">
                <button
                  className="icon-button"
                  aria-label={`Editar campo ${f.label}`}
                  onClick={() => setEditing(f)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button danger-text"
                  aria-label={`Remover campo ${f.label}`}
                  onClick={() =>
                    setRemove({ path: `fields/${f.id}`, label: f.label })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {!data.fields.length && (
          <p>Nenhum campo adicional. Experimente criar “Vista para o mar”.</p>
        )}
      </section>
      {["tags", "category", "situation"].map((kind) => (
        <TaxonomyManager
          key={kind}
          kind={kind}
          items={
            kind === "tags"
              ? data.tags
              : data.taxonomies.filter((t) => t.kind === kind)
          }
          reload={load}
          onRemove={(item) =>
            setRemove({
              path: `${kind === "tags" ? "tags" : "taxonomies"}/${item.id}`,
              label: item.name,
            })
          }
        />
      ))}
      {editing && (
        <FieldForm
          field={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await load();
            setEditing(null);
          }}
        />
      )}{" "}
      {remove && (
        <Modal title="Remover configuração" onClose={() => setRemove(null)}>
          <div className="modal-content">
            <h2>Remover {remove.label}?</h2>
            <p>
              Campos com dados serão arquivados para preservar o histórico.
              Tags, categorias e situações serão desvinculadas dos imóveis.
            </p>
            <button
              className="button danger"
              onClick={async () => {
                try {
                  await api(`admin/${remove.path}`, {}, "DELETE");
                  setRemove(null);
                  await load();
                } catch (err) {
                  setError((err as Error).message);
                  setRemove(null);
                }
              }}
            >
              Confirmar remoção
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function FieldForm({
  field,
  onClose,
  onSaved,
}: {
  field: Field | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [type, setType] = useState<FieldType>(field?.type || "text");
  const [isPublic, setPublic] = useState(field?.public ?? true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={field ? "Editar campo" : "Adicionar campo"} onClose={onClose}>
      <form
        className="modal-content stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = new FormData(e.currentTarget);
          try {
            await api(
              `admin/fields${field ? `/${field.id}` : ""}`,
              {
                label: form.get("label"),
                type,
                public: isPublic,
                required: form.get("required") === "on",
                filterable: isPublic && form.get("filterable") === "on",
                options: String(form.get("options") || "")
                  .split("\n")
                  .map((v) => v.trim())
                  .filter(Boolean),
              },
              field ? "PUT" : "POST",
            );
            await onSaved();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Nome do campo
          <input
            name="label"
            required
            defaultValue={field?.label}
            minLength={2}
            maxLength={80}
          />
        </label>
        <label>
          Tipo
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FieldType)}
          >
            {Object.entries(fieldTypes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {["select", "multiselect"].includes(type) && (
          <label>
            Opções (uma por linha)
            <textarea
              name="options"
              required
              rows={5}
              defaultValue={field?.options.map((o) => o.value).join("\n")}
            />
          </label>
        )}
        <label className="check-line">
          <input
            name="required"
            type="checkbox"
            defaultChecked={field?.required}
          />
          Obrigatório no cadastro
        </label>
        <label className="check-line">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setPublic(e.target.checked)}
          />
          Exibir na página do imóvel
        </label>
        <label className="check-line">
          <input
            name="filterable"
            type="checkbox"
            disabled={!isPublic}
            defaultChecked={field?.filterable}
          />
          Disponibilizar como filtro na busca
        </label>
        <Notice error>{error}</Notice>
        <button className="button" disabled={busy}>
          {busy ? "Salvando…" : "Salvar campo"}
        </button>
      </form>
    </Modal>
  );
}
function TaxonomyManager({
  kind,
  items,
  reload,
  onRemove,
}: {
  kind: string;
  items: { id: string; name: string }[];
  reload: () => Promise<void>;
  onRemove: (item: { id: string; name: string }) => void;
}) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [error, setError] = useState("");
  const path = kind === "tags" ? "tags" : "taxonomies";
  return (
    <section className="admin-card">
      <h2>
        {kind === "tags"
          ? "Tags dos imóveis"
          : kind === "category"
            ? "Categorias"
            : "Situações"}
      </h2>
      <div className="taxonomy-list">
        {items.map((item) => (
          <div key={item.id}>
            <span>{item.name}</span>
            <button
              className="icon-button"
              aria-label={`Editar ${item.name}`}
              onClick={() => {
                setId(item.id);
                setName(item.name);
              }}
            >
              <Pencil size={14} />
            </button>
            <button
              className="icon-button danger-text"
              aria-label={`Excluir ${item.name}`}
              onClick={() => onRemove(item)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <form
        className="inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await api(
              `admin/${path}${id ? `/${id}` : ""}`,
              { name, ...(kind === "tags" ? {} : { kind }) },
              id ? "PUT" : "POST",
            );
            setName("");
            setId("");
            await reload();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <label>
          {id ? "Editar nome" : "Adicionar opção"}
          <input
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button className="button secondary">
          {id ? "Salvar" : "Adicionar"}
        </button>
        {id && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setId("");
              setName("");
            }}
          >
            Cancelar
          </button>
        )}
      </form>
      <Notice error>{error}</Notice>
    </section>
  );
}
