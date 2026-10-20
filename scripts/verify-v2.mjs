import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
let cookie = "";
const cleanup = [], report = [];
async function request(path, data, method = data === undefined ? "GET" : "POST", anonymous = false) {
  const response = await fetch(`${base}/api/${path}`, { method, headers: { origin: new URL(base).origin, ...(data !== undefined ? { "content-type": "application/json" } : {}), ...(!anonymous && cookie ? { cookie } : {}) }, body: data !== undefined ? JSON.stringify(data) : undefined });
  const body = await response.json();
  return { status: response.status, body, response };
}
async function ok(path, data, method) { const r = await request(path,data,method); assert.equal(r.status,200,`${path}: ${JSON.stringify(r.body)}`); return r.body; }
const unique = `v2-${Date.now()}`;
try {
  const login = await request("admin/login",{email:process.env.TEST_ADMIN_EMAIL||"mari@admin.com.br",password:process.env.TEST_ADMIN_PASSWORD||"Admin"});
  assert.equal(login.status,200); cookie = login.response.headers.getSetCookie().map(s=>s.split(";")[0]).join("; ");
  const original = await ok("admin/board");
  const initial = original.find(s=>s.isDefault); assert(initial);
  const lead = await ok("admin/leads",{firstName:"Verificação V2",phone:`479${String(Date.now()).slice(-8)}`,notes:`Comentário privado ${unique}`});
  cleanup.push(()=>ok(`admin/leads/${lead.id}`,{},"DELETE"));
  const detail = await ok(`admin/leads/${lead.id}`); assert.equal(detail.consentAt,null);
  const duplicate = await ok("admin/leads",{firstName:"Não sobrescrever",phone:detail.phone}); assert.equal(duplicate.id,lead.id); assert.equal(duplicate.existing,true);
  assert.equal((await ok(`admin/leads/${lead.id}`)).firstName,"Verificação V2");
  const stage = await ok("admin/stages",{name:`Em atendimento ${unique}`});
  cleanup.push(()=>ok(`admin/stages/${stage.id}`,{destinationId:initial.id},"DELETE"));
  await ok("admin/lead-move",{leadId:lead.id,stageId:stage.id});
  assert.equal((await ok("admin/board")).find(s=>s.id===stage.id).leads[0].id,lead.id);
  assert.equal((await request(`admin/stages/${stage.id}`,{},"DELETE")).status,409);
  await ok("admin/stages/order",{ids:[stage.id,...original.map(s=>s.id)]},"PUT");
  assert.equal((await ok("admin/board"))[0].id,stage.id);
  const comment = await ok("admin/comments",{leadId:lead.id,text:`Privado ${unique}`});
  await ok(`admin/comments/${comment.id}`,{leadId:lead.id,text:`Editado ${unique}`},"PUT");
  assert((await ok(`admin/lead-extras/${lead.id}`)).comments.some(c=>c.text===`Editado ${unique}`));
  report.push("Cadastro manual, deduplicação, consentimento, Kanban e comentários");
  const appointment = {title:`Visita ${unique}`,typeId:"visit",leadId:lead.id,startsAt:"2097-01-12T17:00:00Z",endsAt:"2097-01-12T18:00:00Z"};
  const a = await ok("admin/appointments",appointment); cleanup.push(()=>ok(`admin/appointments/${a.id}`,{},"DELETE"));
  const overlap = {...appointment,title:`Conflito ${unique}`,startsAt:"2097-01-12T17:30:00Z",endsAt:"2097-01-12T18:30:00Z"};
  const conflict = await request("admin/appointments",overlap); assert.equal(conflict.status,409); assert(conflict.body.conflicts.some(c=>c.id===a.id));
  const allowed = await ok("admin/appointments",{...overlap,allowConflict:true}); cleanup.push(()=>ok(`admin/appointments/${allowed.id}`,{},"DELETE"));
  await ok(`admin/appointments/${allowed.id}`,{...overlap,status:"cancelled"},"PUT");
  const adjacent = await ok("admin/appointments",{...appointment,startsAt:"2097-01-12T18:00:00Z",endsAt:"2097-01-12T19:00:00Z"}); cleanup.push(()=>ok(`admin/appointments/${adjacent.id}`,{},"DELETE"));
  assert.equal((await request("admin/appointments",{...appointment,endsAt:appointment.startsAt})).status,400);
  const parallel = await Promise.all([1,2].map(i=>request("admin/appointments",{...appointment,title:`Concorrência ${i} ${unique}`,startsAt:"2097-01-13T17:00:00Z",endsAt:"2097-01-13T18:00:00Z"})));
  for(const result of parallel.filter(r=>r.status===200)) cleanup.push(()=>ok(`admin/appointments/${result.body.id}`,{},"DELETE"));
  assert.deepEqual(parallel.map(r=>r.status).sort(),[200,409]);
  assert((await ok(`admin/appointments?leadId=${lead.id}`)).some(e=>e.id===a.id));
  report.push("Agenda: sobreposição, confirmação explícita, horários adjacentes, cancelados e concorrência");
  const properties = await ok("admin/properties?status=published"); assert(properties.length);
  const ids = properties.slice(0,2).map(p=>p.id);
  const selection = await ok("admin/selections",{leadId:lead.id,title:`Seleção ${unique}`,propertyIds:ids});
  const second = await ok("admin/selections",{leadId:lead.id,title:`Outra seleção ${unique}`,propertyIds:ids.slice(0,1)}); assert.notEqual(selection.publicToken,second.publicToken);
  const edited = await ok(`admin/selections/${selection.id}`,{leadId:lead.id,title:`Revisada ${unique}`,propertyIds:ids.slice(0,1),revision:selection.revision},"PUT"); assert.equal(edited.publicToken,selection.publicToken);
  const shared = await request(`shared/${selection.publicToken}`,undefined,"GET",true); assert.equal(shared.status,200); assert.equal(shared.body.items.length,1);
  assert.deepEqual(Object.keys(shared.body).sort(),["items","title"]); assert(!JSON.stringify(shared.body).includes(detail.phone)); assert(!JSON.stringify(shared.body).includes("Privado"));
  assert.equal((await request(`selection/${ids[0]}`,{},"DELETE",true)).status,401);
  for(const path of ["admin/board",`admin/lead-extras/${lead.id}`,"admin/appointments"]) assert.equal((await request(path,undefined,"GET",true)).status,401);
  assert.equal((await request(`admin/selections/${selection.id}`,{leadId:lead.id,title:"Obsoleto",propertyIds:[],revision:0},"PUT")).status,409);
  report.push("Múltiplas seleções, edição mantendo o link, revisão concorrente e proteção de dados privados");
  const fields = [];
  for(const type of ["number","money","boolean","multiselect","text","date"]) {
    const field = await ok("admin/fields",{label:`Campo ${type} ${unique}`,type,required:false,public:true,filterable:true,options:type==="multiselect"?["A","B"]:[]}); fields.push(field); cleanup.push(()=>ok(`admin/fields/${field.id}`,{},"DELETE"));
  }
  const config = await ok("admin/settings"); const trade = config.tags.find(t=>t.key==="trade_in"); assert(trade);
  const values = [70,500000,true,["A","B"],"Vista livre","2030-10-10"];
  const payload = {...properties[0],title:`Imóvel ${unique}`,city:"Camboriú",price:1000000,area:120,bathrooms:3,bedrooms:3,suites:2,parking:2,status:"published",tagIds:[trade.id],imageIds:[],customValues:Object.fromEntries(fields.map((f,i)=>[f.id,values[i]]))};
  const property = await ok("admin/properties",payload); cleanup.push(()=>ok(`admin/properties/${property.id}`,{},"DELETE"));
  const query = new URLSearchParams({q:unique,cityId:"camboriu-sc",minPrice:"900000",maxPrice:"1100000",minArea:"100",maxArea:"130",bedrooms:"3",suites:"2",bathrooms:"3",parking:"2",tag:trade.id,[`field_${fields[0].id}_min`] : "60",[`field_${fields[0].id}_max`] : "80",[`field_${fields[1].id}_min`]:"400000",[`field_${fields[2].id}`]:"true",[`field_${fields[3].id}`]:"B",[`field_${fields[4].id}`]:"livre",[`field_${fields[5].id}`]:"2030-10-10"});
  const found = await ok(`properties?${query}`); assert.equal(found.total,1); assert.equal(found.items[0].cityId,"camboriu-sc"); assert.equal(found.items[0].bathrooms,3);
  query.set("cityId","balneario-camboriu-sc"); assert.equal((await ok(`properties?${query}`)).total,0); query.set("cityId","camboriu-sc"); query.set(`field_${fields[0].id}_max`,"65"); assert.equal((await ok(`properties?${query}`)).total,0);
  report.push("Filtros combinados reais: municípios distintos, preço/área, cômodos e seis tipos de campo");
  console.log(report.map(s=>`OK: ${s}`).join("\n"));
} finally {
  const failures=[];
  for(const remove of cleanup.reverse()) try { await remove(); } catch(e) { failures.push(e.message); }
  if(failures.length) { console.error("Falhas ao remover registros exclusivos desta verificação:",failures);process.exitCode=1; }
  if(cookie) await request("admin/logout",{});
}
