"use client";

import { useState } from "react";
import Link from "next/link";

const steps = [
  ["Objetivo", "O que você quer conquistar com esse imóvel?", ["Comprar para morar", "Ter uma segunda residência ou imóvel de lazer", "Investir para valorização ou revenda", "Gerar renda com locação anual", "Diversificar patrimônio", "Ainda estou avaliando"]],
  ["Localização", "Onde você imagina encontrar esse imóvel?", ["Balneário Camboriú", "Camboriú", "Praia Brava — Itajaí", "Quero ajuda para escolher a região"]],
  ["Momento", "Quando você pretende utilizar ou adquirir o imóvel?", ["Agora", "Em até 6 meses", "Entre 6 e 12 meses", "Entre 1 e 2 anos", "Sem prazo definido"]],
  ["Configuração", "Quantos dormitórios fazem sentido para você?", ["1 dormitório", "2 dormitórios", "3 dormitórios", "4 dormitórios ou mais", "Sem preferência"]],
  ["Investimento", "Quanto você pretende investir?", ["Até R$ 800 mil", "R$ 800 mil a R$ 1,2 milhão", "R$ 1,2 milhão a R$ 2 milhões", "R$ 2 milhões a R$ 3 milhões", "R$ 3 milhões a R$ 5 milhões", "Acima de R$ 5 milhões", "Informar outro valor", "Ainda não defini"]],
  ["Pagamento", "Qual forma de pagamento você busca?", ["À vista", "Financiamento bancário", "Entrada + parcelas", "Parcelamento direto com a construtora", "Entrada + parcelas + reforços", "Quero avaliar a melhor condição"]],
] as const;

export function ConsultationWizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const current = steps[step];
  async function choose(value: string) {
    const next = [...answers]; next[step] = value; setAnswers(next);
    if (step < steps.length - 1) setStep(step + 1);
  }
  async function submit() {
    const res = await fetch("/api/consultation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: name, phone, answers: { objective: answers[0], regions: [answers[1]], timing: answers[2], bedrooms: answers[3], budget: answers[4], payment: answers[5] } }) });
    if (res.ok) setDone(true);
  }
  if (done) return <main className="consultation-shell"><div className="consultation-card"><span className="eyebrow">Consultoria recebida</span><h1>Agora conheço um pouco melhor o que você procura.</h1><p>Vou analisar as possibilidades que combinam com o seu perfil e entrar em contato pelo WhatsApp.</p><Link className="button-primary" href="/">Voltar ao site</Link></div></main>;
  if (step === steps.length) return <main className="consultation-shell"><div className="consultation-card"><span className="eyebrow">Seu perfil</span><h1>Como posso falar com você?</h1><p>Compartilhe seu primeiro nome e WhatsApp para receber um atendimento personalizado.</p><input placeholder="Primeiro nome" value={name} onChange={(e) => setName(e.target.value)} /><input placeholder="WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} /><button className="button-primary" disabled={!name || !phone} onClick={submit}>Concluir consultoria →</button></div></main>;
  return <main className="consultation-shell"><header className="consultation-header"><Link href="/">Mari Imob</Link><span>{step + 1} de {steps.length}</span></header><div className="consultation-progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div><section className="consultation-grid"><div><button className="back-link" onClick={() => setStep(Math.max(0, step - 1))}>← Voltar</button><span className="eyebrow">{current[0]}</span><h1>{current[1]}</h1><p>Escolha a opção que mais se aproxima do que você procura.</p></div><div className="answer-list">{current[2].map((option, index) => <button key={option} className={answers[step] === option ? "answer selected" : "answer"} onClick={() => choose(option)}><small>{String(index + 1).padStart(2, "0")}</small>{option}<b>○</b></button>)}</div></section></main>;
}
