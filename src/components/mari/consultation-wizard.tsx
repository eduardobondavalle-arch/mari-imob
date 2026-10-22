"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { phoneMask } from "@/lib/mari/types";

const steps = [
  ["Objetivo", "O que você quer conquistar com esse imóvel?", ["Comprar para morar", "Ter uma segunda residência ou imóvel de lazer", "Investir para valorização ou revenda", "Gerar renda com locação anual", "Diversificar patrimônio", "Ainda estou avaliando"]],
  ["Localização", "Onde você imagina encontrar esse imóvel?", ["Balneário Camboriú", "Camboriú", "Praia Brava — Itajaí", "Quero ajuda para escolher a região"]],
  ["Momento", "Quando você pretende utilizar ou adquirir o imóvel?", ["Agora", "Em até 6 meses", "Entre 6 e 12 meses", "Entre 1 e 2 anos", "Sem prazo definido"]],
  ["Configuração", "Quantos dormitórios fazem sentido para você?", ["1 dormitório", "2 dormitórios", "3 dormitórios", "4 dormitórios ou mais", "Sem preferência"]],
  ["Investimento", "Quanto você pretende investir?", ["Até R$ 800 mil", "R$ 800 mil a R$ 1,2 milhão", "R$ 1,2 milhão a R$ 2 milhões", "R$ 2 milhões a R$ 3 milhões", "R$ 3 milhões a R$ 5 milhões", "Acima de R$ 5 milhões", "Informar outro valor", "Ainda não defini"]],
  ["Pagamento", "Qual forma de pagamento você busca?", ["À vista", "Financiamento bancário", "Entrada + parcelas", "Parcelamento direto com a construtora", "Entrada + parcelas + reforços", "Quero avaliar a melhor condição"]],
] as const;

export function ConsultationWizard({ embedded = false }: { embedded?: boolean }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const current = steps[step];
  const Shell = embedded ? "section" : "main";
  const Heading = embedded ? "h2" : "h1";
  const shellProps = embedded ? { id: "consultoria" } : {};
  const shellClass = `consultation-shell${embedded ? " consultation-embedded" : ""}`;

  function choose(value: string) {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    setStep(step + 1);
  }

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: name,
          phone,
          consent,
          answers: {
            objective: answers[0],
            regions: [answers[1]],
            timing: answers[2],
            bedrooms: answers[3],
            budget: answers[4],
            payment: answers[5],
          },
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível concluir a consultoria.");
      setDone(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Não foi possível concluir a consultoria.");
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setStep(0);
    setAnswers([]);
    setName("");
    setPhone("");
    setConsent(false);
    setError("");
    setDone(false);
  }

  if (done) return <Shell {...shellProps} className={shellClass}>
    <div className="consultation-card consultation-result">
      <span className="consultation-success-icon"><Check size={24} /></span>
      <span className="eyebrow">Consultoria recebida</span>
      <Heading>Agora conheço um pouco melhor o que você procura.</Heading>
      <p>Vou analisar as possibilidades que combinam com o seu perfil e entrar em contato pelo WhatsApp.</p>
      {embedded ? <button className="button-primary" onClick={restart}>Fazer uma nova consultoria</button> : <Link className="button-primary" href="/">Voltar ao site</Link>}
    </div>
  </Shell>;

  if (step === steps.length) return <Shell {...shellProps} className={shellClass}>
    <div className="consultation-card consultation-contact-card">
      <button className="back-link" onClick={() => setStep(steps.length - 1)}><ArrowLeft size={16} /> Voltar</button>
      <span className="eyebrow">Seu perfil</span>
      <Heading>Como posso falar com você?</Heading>
      <p>Compartilhe seu primeiro nome e WhatsApp para receber um atendimento personalizado.</p>
      <label>Primeiro nome<input autoComplete="given-name" placeholder="Como você gosta de ser chamado?" value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>WhatsApp<input autoComplete="tel" inputMode="tel" placeholder="(47) 99999-9999" value={phone} onChange={(event) => setPhone(phoneMask(event.target.value))} /></label>
      <label className="consultation-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />Autorizo o contato da Mari sobre esta consultoria.</label>
      {error && <p className="consultation-error" role="alert">{error}</p>}
      <button className="button-primary" disabled={busy || name.trim().length < 2 || phone.replace(/\D/g, "").length < 10 || !consent} onClick={submit}>{busy ? "Enviando…" : "Concluir consultoria"} <ArrowRight size={18} /></button>
    </div>
  </Shell>;

  return <Shell {...shellProps} className={shellClass}>
    <header className="consultation-header">
      {embedded ? <strong>Consultoria imobiliária personalizada</strong> : <Link href="/">Mari Imob</Link>}
      <span>{step + 1} de {steps.length}</span>
    </header>
    <div className="consultation-progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
    <section className="consultation-grid">
      <div>
        <button className="back-link" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}><ArrowLeft size={16} /> Voltar</button>
        <span className="eyebrow">{current[0]}</span>
        <Heading>{current[1]}</Heading>
        <p>Escolha a opção que mais se aproxima do que você procura.</p>
      </div>
      <div className="answer-list">{current[2].map((option, index) => <button key={option} className={answers[step] === option ? "answer selected" : "answer"} onClick={() => choose(option)}><small>{String(index + 1).padStart(2, "0")}</small><span>{option}</span><b aria-hidden="true">○</b></button>)}</div>
    </section>
  </Shell>;
}
