"use client";
import { useState } from "react";
import { api, Notice } from "./ui";
import { phoneMask } from "@/lib/mari/types";

export function OwnerForm() {
  const [error,setError]=useState(""), [done,setDone]=useState(false), [busy,setBusy]=useState(false);
  if(done) return <div className="owner-success"><h2>Recebi as informações do seu imóvel.</h2><p>A Mari poderá entrar em contato pelo WhatsApp para conversar sobre as possibilidades.</p></div>;
  return <form className="owner-form" onSubmit={async(e)=>{e.preventDefault();setBusy(true);setError("");const f=new FormData(e.currentTarget);try{await api("owner-submissions",{firstName:f.get("firstName"),phone:f.get("phone"),purpose:f.get("purpose"),propertyType:f.get("propertyType"),city:f.get("city"),neighborhood:f.get("neighborhood"),location:f.get("location"),area:f.get("area")?Number(f.get("area")):null,bedrooms:f.get("bedrooms")?Number(f.get("bedrooms")):null,askingPrice:f.get("askingPrice")?Number(f.get("askingPrice")):null,notes:f.get("notes"),consent:true});setDone(true)}catch(err){setError((err as Error).message)}finally{setBusy(false)}}}>
    <div className="form-grid"><label>Primeiro nome<input name="firstName" required minLength={2}/></label><label>WhatsApp<input name="phone" required onChange={e=>e.target.value=phoneMask(e.target.value)}/></label><label>Finalidade<select name="purpose"><option value="sale">Venda</option><option value="rent">Locação</option></select></label><label>Tipo de imóvel<input name="propertyType" required placeholder="Apartamento, casa, terreno..."/></label><label>Cidade<input name="city" required/></label><label>Bairro<input name="neighborhood" required/></label><label className="span-2">Endereço ou localização aproximada<input name="location"/></label><label>Área aproximada (m²)<input name="area" type="number" min="0" step=".01"/></label><label>Dormitórios<input name="bedrooms" type="number" min="0"/></label><label>Valor pretendido (R$)<input name="askingPrice" type="number" min="0" step=".01"/></label><label className="span-2">Descrição ou observações<textarea name="notes" rows={4}/></label></div>
    <label className="check-line"><input type="checkbox" required/>Autorizo o uso dos dados para atendimento imobiliário, conforme a Política de Privacidade.</label><Notice error>{error}</Notice><button className="button" disabled={busy}>{busy?"Enviando…":"Enviar meu imóvel"}</button>
  </form>;
}
