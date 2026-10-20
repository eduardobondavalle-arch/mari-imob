"use client";
import { useState } from "react";
import Link from "next/link";
import { Heart, Copy, ArrowRight, LogOut } from "lucide-react";
import { useMari } from "./provider";
import { SelectionPresentation } from "./selection-presentation";
import { Busy, Notice, api, Modal } from "./ui";
import { priceLabel } from "@/lib/mari/types";
export function SelectionPage() {
  const { client, ready, openLogin, logout } = useMari();
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  if (!ready)
    return (
      <div className="container section">
        <Busy />
      </div>
    );
  return (
    <div className="container section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">SEUS PRÓXIMOS PASSOS, EM UM SÓ LUGAR</p>
          <h1>
            Minha Seleção<span className="title-dot">.</span>
          </h1>
          <p>
            {client
              ? `${client.firstName}, aqui estão os lugares que chamaram a sua atenção.`
              : "Guarde suas escolhas e compartilhe novas possibilidades."}
          </p>
        </div>
        {client && (
          <button className="text-button" onClick={logout}>
            <LogOut size={16} /> Sair
          </button>
        )}
      </div>
      {client?.items.length ? (
        <>
          <div className="selection-toolbar">
            <span>{client.items.length} imóveis selecionados</span>
            <button
              className="button secondary"
              onClick={async () => {
                const url = `${location.origin}/selecao/${client.publicToken}`;
                try {
                  await navigator.clipboard.writeText(url);
                  setMessage(
                    "Link copiado. Ele contém somente os imóveis, sem seus dados pessoais.",
                  );
                } catch {
                  setMessage(url);
                }
              }}
            >
              <Copy size={16} /> Copiar link da seleção
            </button>
          </div>
          <Notice>{message}</Notice>
          <SelectionPresentation
            items={client.items}
            title="Seus próximos endereços"
            recipientName={client.firstName}
          />
          {client.items.length > 1 && (
            <div className="comparison">
              <h2>Compare suas escolhas</h2>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Imóvel</th>
                      {client.items.map((p) => (
                        <th key={p.id}>{p.title}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      "Valor",
                      "Cidade",
                      "Quartos",
                      "Suítes",
                      "Vagas",
                      "Área",
                    ].map((label, index) => (
                      <tr key={label}>
                        <th>{label}</th>
                        {client.items.map((p) => (
                          <td key={p.id}>
                            {
                              [
                                priceLabel(p.price),
                                p.city,
                                p.bedrooms ?? "—",
                                p.suites ?? "—",
                                p.parking ?? "—",
                                p.area === null ? "—" : `${p.area} m²`,
                              ][index]
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <Heart size={40} strokeWidth={1} />
          <h2>Abra espaço para novas possibilidades.</h2>
          <p>
            Toque no coração dos imóveis que gostar. Eles ficarão reunidos aqui.
          </p>
          <div className="button-row">
            <Link className="button" href="/buscar">
              Explorar imóveis <ArrowRight size={17} />
            </Link>
            {!client && (
              <button className="button secondary" onClick={openLogin}>
                Recuperar minha seleção
              </button>
            )}
          </div>
        </div>
      )}
      {client && (
        <div className="account-tools">
          <p>Seus dados e sua privacidade</p>
          <button className="text-button" onClick={openLogin}>
            Verificar telefone / acessar em outro dispositivo
          </button>
          <button
            className="text-button"
            onClick={async () => {
              try {
                if (!client.verified) {
                  openLogin();
                  return;
                }
                const blob = new Blob([JSON.stringify(client, null, 2)], {
                  type: "application/json",
                });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "minha-selecao-mari.json";
                link.click();
                URL.revokeObjectURL(link.href);
              } catch {
                setError("Não foi possível exportar.");
              }
            }}
          >
            Exportar meus dados
          </button>
          <button
            className="text-button danger-text"
            onClick={() => setConfirmDelete(true)}
          >
            Excluir meu cadastro
          </button>
          <Notice error>{error}</Notice>
        </div>
      )}
      {confirmDelete && (
        <Modal
          title="Excluir meus dados"
          onClose={() => setConfirmDelete(false)}
        >
          <div className="modal-content">
            <h2>Excluir seu cadastro?</h2>
            <p>
              Seu cadastro, solicitações e seleção serão excluídos
              permanentemente. É necessário verificar seu telefone antes.
            </p>
            <button
              className="button danger"
              onClick={async () => {
                try {
                  await api("client/account", {}, "DELETE");
                  await logout();
                  setConfirmDelete(false);
                } catch (err) {
                  setError((err as Error).message);
                  setConfirmDelete(false);
                }
              }}
            >
              Excluir meus dados
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
