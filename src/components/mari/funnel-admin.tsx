"use client";

import { useCallback, useEffect, useState } from "react";
import { api, Busy, Notice } from "./ui";

type Funnel = {
  total: number;
  qualified: number;
  movementCount: number;
  stages: {
    id: string;
    name: string;
    funnelPosition: number | null;
    leads: number;
    percentage: number;
    averageDays: number | null;
  }[];
  conversions: {
    from: string;
    to: string;
    entered: number;
    advanced: number;
    rate: number | null;
  }[];
};

export function FunnelAdmin() {
  const [data, setData] = useState<Funnel | null>(null);
  const [days, setDays] = useState("");
  const [qualifiedOnly, setQualifiedOnly] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    const query = new URLSearchParams({ qualified: String(qualifiedOnly) });
    if (days) query.set("days", days);
    api<Funnel>(`admin/funnel?${query}`).then(setData).catch((e) => setError(e.message));
  }, [days, qualifiedOnly]);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  if (!data && !error) return <Busy />;
  return <section className="stack">
    <Notice error>{error}</Notice>
    <div className="admin-toolbar">
      <label>Período<select value={days} onChange={(e) => setDays(e.target.value)}><option value="">Todo o histórico</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Último ano</option></select></label>
      <label className="check-line"><input type="checkbox" checked={qualifiedOnly} onChange={(e) => setQualifiedOnly(e.target.checked)}/>Somente qualificados</label>
    </div>
    {data && <>
      <div className="metrics">
        <div className="metric"><span>Leads nas etapas</span><strong>{data.total}</strong></div>
        <div className="metric"><span>Perfis qualificados</span><strong>{data.qualified}</strong></div>
        <div className="metric"><span>Movimentações no período</span><strong>{data.movementCount}</strong></div>
        <div className="metric"><span>Etapas no funil</span><strong>{data.stages.length}</strong></div>
      </div>
      <div className="admin-card">
        <h2>Distribuição atual</h2>
        <p>A quantidade atual em cada etapa é exibida separadamente das conversões calculadas pelo histórico.</p>
        <div className="funnel-bars">{data.stages.map((stage, index) => <div key={stage.id} className="funnel-row"><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage.name}</strong><div><i style={{ width: `${Math.max(stage.leads ? 8 : 0, stage.percentage)}%` }} /></div><b>{stage.leads} · {stage.percentage}%</b>{stage.averageDays !== null && <small>Tempo médio concluído: {stage.averageDays} dias</small>}</div>)}</div>
        {!data.stages.length && <div className="empty-admin">Abra “Interessados”, edite uma coluna e marque “Incluir esta etapa no funil comercial”.</div>}
      </div>
      {data.conversions.length > 0 && <div className="admin-card"><h2>Conversão registrada</h2><div className="conversion-list">{data.conversions.map((item) => <div key={`${item.from}-${item.to}`}><span>{item.from} → {item.to}</span>{item.rate === null ? <small>Dados insuficientes</small> : <strong>{item.rate}% <small>({item.advanced} de {item.entered})</small></strong>}</div>)}</div><p>As taxas usam somente movimentações registradas após a implantação do histórico.</p></div>}
    </>}
  </section>;
}
