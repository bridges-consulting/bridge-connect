import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface FormData {
  nome: string; whatsapp: string; email: string;
  cpf: string; cidade: string; como_conheceu: string; indicado_por: string;
  ocupacao: string; outra_ocupacao: string; tamanho_rede: string;
  experiencia_afiliado: string; relacionamento: string;
  canais: string[]; frequencia: string; interesse_treinamento: string;
  tipo_pix: string; chave_pix: string;
  banco: string; agencia: string; conta: string; tipo_conta: string;
  titular_conta: string; cpf_titular: string;
  aceite_regulamento: boolean; aceite_whatsapp: boolean;
}

const INITIAL: FormData = {
  nome:"",whatsapp:"",email:"",cpf:"",cidade:"",como_conheceu:"",indicado_por:"",
  ocupacao:"",outra_ocupacao:"",tamanho_rede:"",experiencia_afiliado:"",relacionamento:"",
  canais:[],frequencia:"",interesse_treinamento:"",
  tipo_pix:"",chave_pix:"",banco:"",agencia:"",conta:"",tipo_conta:"",titular_conta:"",cpf_titular:"",
  aceite_regulamento:false,aceite_whatsapp:false,
};

const COMO_CONHECEU=["Indicação de outro conector","Instagram","LinkedIn","WhatsApp / Grupo","Evento / Palestra","Outro"];
const OCUPACOES=["Profissional liberal (médico, advogado, contador...)","Executivo / Gestor corporativo","Empreendedor / Empresário","Consultor / Prestador de serviços","Corretor (imóveis, seguros, financeiro)","Coach / Mentor / Educador","Influenciador / Criador de conteúdo","Servidor público","Estudante / Recém-formado","Outro"];
const REDES=["Pequena — até 200 contatos ativos","Média — de 200 a 1.000 contatos","Grande — de 1.000 a 5.000 contatos","Muito grande — acima de 5.000 contatos"];
const CANAIS_OPTS=["Instagram — posts, stories e DMs","LinkedIn — conexões e conteúdo profissional","WhatsApp — contatos pessoais e grupos","Indicações presenciais / networking","YouTube ou podcast","E-mail / newsletter própria","Comunidade ou grupo fechado","Eventos e palestras"];
const FREQUENCIAS=["Esporádica — quando surgir oportunidade natural","Mensal — de 1 a 3 indicações por mês","Semanal — indicações frequentes e ativas"];
const TIPOS_PIX=["CPF","E-mail","Telefone","Chave aleatória","Prefiro informar dados bancários"];
const STEPS=["Identificação","Perfil","Canais","Pagamento","Regulamento"];

const fmtCPF=(v:string)=>{const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=3)return d;if(d.length<=6)return`${d.slice(0,3)}.${d.slice(3)}`;if(d.length<=9)return`${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;return`${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;};
const fmtPhone=(v:string)=>{const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=2)return d;if(d.length<=6)return`(${d.slice(0,2)}) ${d.slice(2)}`;if(d.length<=10)return`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;};

const iCls="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-primary/60 focus:bg-primary/[0.05] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.1)] transition-all duration-200";

function Field({label,required,children}:{label:string;required?:boolean;children:React.ReactNode}){return(<div className="space-y-1.5"><label className="block text-xs font-semibold tracking-widest uppercase text-primary/80">{label}{required&&<span className="text-primary ml-1">*</span>}</label>{children}</div>);}
function Input({value,onChange,placeholder,type="text"}:{value:string;onChange:(v:string)=>void;placeholder?:string;type?:string}){return<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className={iCls}/>;}
function Textarea({value,onChange,placeholder}:{value:string;onChange:(v:string)=>void;placeholder?:string}){return<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${iCls} resize-none`}/>;}
function Sel({value,onChange,options,placeholder}:{value:string;onChange:(v:string)=>void;options:string[];placeholder?:string}){return(<select value={value} onChange={e=>onChange(e.target.value)} className={`${iCls} cursor-pointer`} style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",paddingRight:"40px",appearance:"none" as const}}>{placeholder&&<option value="" style={{background:"#1a4a3a"}}>{placeholder}</option>}{options.map(o=><option key={o} value={o} style={{background:"#1a4a3a"}}>{o}</option>)}</select>);}

function Radio({options,value,onChange,inline}:{options:string[];value:string;onChange:(v:string)=>void;inline?:boolean}){
  return(<div className={`flex gap-2 ${inline?"flex-row flex-wrap":"flex-col"}`}>{options.map(opt=>{const s=value===opt;return(<div key={opt} onClick={()=>onChange(opt)} className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${inline?"flex-1 min-w-[120px]":""} ${s?"border-primary/60 bg-primary/10 text-primary/90":"border-white/[0.08] bg-white/[0.04] text-foreground/60 hover:border-primary/30 hover:bg-primary/[0.05]"}`}><div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${s?"border-primary bg-primary":"border-white/25"}`}>{s&&<div className="w-1.5 h-1.5 rounded-full bg-background"/>}</div>{opt}</div>);})}</div>);
}

function Check({options,values,onChange}:{options:string[];values:string[];onChange:(v:string[])=>void}){
  const t=(opt:string)=>onChange(values.includes(opt)?values.filter(v=>v!==opt):[...values,opt]);
  return(<div className="flex flex-col gap-2">{options.map(opt=>{const s=values.includes(opt);return(<div key={opt} onClick={()=>t(opt)} className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${s?"border-primary/60 bg-primary/10 text-primary/90":"border-white/[0.08] bg-white/[0.04] text-foreground/60 hover:border-primary/30 hover:bg-primary/[0.05]"}`}><div className={`min-w-[18px] min-h-[18px] rounded border-2 flex items-center justify-center text-[10px] font-black transition-all ${s?"border-primary bg-primary text-background":"border-white/25 text-transparent"}`}>✓</div>{opt}</div>);})}</div>);
}

function Tip({children}:{children:React.ReactNode}){return<div className="bg-primary/[0.07] border-l-[3px] border-l-primary border border-primary/15 rounded-r-lg px-4 py-3 text-xs text-foreground/60 leading-relaxed">{children}</div>;}
function Aceite({checked,onToggle,children}:{checked:boolean;onToggle:()=>void;children:React.ReactNode}){return(<div onClick={onToggle} className={`flex items-start gap-4 px-4 py-4 rounded-lg border cursor-pointer transition-all duration-200 ${checked?"border-primary/60 bg-primary/10":"border-primary/20 bg-primary/[0.05] hover:border-primary/40"}`}><div className={`min-w-[20px] min-h-[20px] w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-black transition-all mt-0.5 ${checked?"border-primary bg-primary text-background":"border-white/25 text-transparent"}`}>✓</div><div className="text-sm text-foreground/80 leading-relaxed">{children}</div></div>);}
function Badge({n}:{n:number}){return(<div className="inline-flex items-center bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-3"><span className="text-[9px] font-bold tracking-[3px] uppercase text-primary">Bloco 0{n}</span></div>);}
function Hr(){return<div className="h-px bg-white/[0.07] my-2"/>;}

const TERMOS=[
  {title:"1. Objetivo do Programa",body:"O Programa Bridges tem como propósito expandir o alcance da The Bridge Consulting por meio de parcerias com conectores que atuem na captação e qualificação de potenciais clientes. O conector não deve realizar consultoria jurídica, prometer resultados, nem prestar informações técnicas de competência exclusiva da equipe."},
  {title:"2. Conduta Esperada",body:"O conector deverá manter conduta ética, transparente e profissional em todas as interações. É vedada a prática de spam, abordagens agressivas ou falsas promessas. O conector compromete-se a não atuar em nome de empresas concorrentes que ofereçam serviços de imigração, sob pena de desligamento e perda de comissões pendentes."},
  {title:"3. Materiais e Uso da Marca",body:"A The Bridge Consulting fornecerá um Kit de Marketing Oficial com materiais aprovados. É proibido criar ou divulgar materiais próprios com a marca The Bridge Consulting sem aprovação prévia e por escrito."},
  {title:"4. Captação de Leads",body:"Cada conector receberá um link individual exclusivo. Um lead será considerado válido quando preencher corretamente o formulário, tiver interesse real e não for cliente já ativo ou lead previamente registrado. Leads inválidos, duplicados ou desqualificados não serão contabilizados para comissionamento."},
  {title:"5. Comissionamento",body:"O conector fará jus a um percentual de comissão sobre o valor líquido do contrato fechado. O pagamento será realizado em até 10 dias úteis após a confirmação. Em contratos parcelados, o pagamento da comissão acompanhará o mesmo parcelamento do cliente."},
  {title:"6. Rescisão e Exclusão",body:"A The Bridge Consulting reserva-se o direito de desligar conectores em casos de violação do regulamento, condutas inadequadas ou uso indevido da marca. Em desligamento voluntário, o conector mantém direito às comissões já adquiridas. Em desligamento por descumprimento, comissões pendentes poderão ser retidas."},
];

const RegisterConector = () => {
  const [step,setStep]=useState(1);
  const [form,setForm]=useState<FormData>(INITIAL);
  const [saving,setSaving]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const set=<K extends keyof FormData>(k:K,v:FormData[K])=>setForm(f=>({...f,[k]:v}));
  const isTrad=form.tipo_pix==="Prefiro informar dados bancários";
  const ok:Record<number,boolean>={
    1:!!(form.nome&&form.whatsapp&&form.email),
    2:!!(form.ocupacao),
    3:form.canais.length>0,
    4:!!(form.tipo_pix),
    5:form.aceite_regulamento&&form.aceite_whatsapp,
  };

  const submit=async()=>{
    if(!ok[5])return;
    setSaving(true);setError(null);
    try{
      const{count}=await supabase.from("candidaturas").select("id",{count:"exact",head:true}).eq("email",form.email);
      if((count??0)>0)throw new Error("Este e-mail já possui uma candidatura em andamento. Entre em contato com a equipe se precisar de ajuda.");
      const{error:e}=await supabase.from("candidaturas").insert({
        nome:form.nome,whatsapp:form.whatsapp,email:form.email,
        cpf:form.cpf||null,cidade:form.cidade||null,
        como_conheceu:form.como_conheceu||null,indicado_por:form.indicado_por||null,
        ocupacao:form.ocupacao==="Outro"?form.outra_ocupacao:form.ocupacao||null,
        tamanho_rede:form.tamanho_rede||null,experiencia_afiliado:form.experiencia_afiliado||null,
        relacionamento:form.relacionamento||null,
        canais_indicacao:form.canais.length?form.canais:null,
        frequencia_indicacoes:form.frequencia||null,
        interesse_treinamento:form.interesse_treinamento||null,
        tipo_pix:form.tipo_pix||null,
        chave_pix:isTrad?null:(form.chave_pix||null),
        banco:isTrad?(form.banco||null):null,agencia:isTrad?(form.agencia||null):null,
        conta:isTrad?(form.conta||null):null,tipo_conta:isTrad?(form.tipo_conta||null):null,
        titular_conta:isTrad?(form.titular_conta||null):null,cpf_titular:isTrad?(form.cpf_titular||null):null,
        aceite_regulamento:true,aceite_whatsapp:form.aceite_whatsapp,aceite_at:new Date().toISOString(),
      });
      if(e)throw e;
      setDone(true);
    }catch(e:unknown){setError(e instanceof Error?e.message:"Erro ao enviar candidatura. Tente novamente.");}
    finally{setSaving(false);}
  };

  if(done)return(
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-2xl text-primary font-bold">✦</div>
        <div>
          <p className="text-[10px] font-bold tracking-[4px] uppercase text-primary mb-2">Candidatura enviada</p>
          <h2 className="text-2xl font-bold text-foreground mb-2">Obrigado, <span className="text-primary italic font-light">{form.nome.split(" ")[0]}</span>!</h2>
          <p className="text-sm text-foreground/50 leading-relaxed max-w-sm mx-auto">Sua candidatura foi recebida. Nossa equipe entrará em contato pelo WhatsApp para os próximos passos.</p>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-5 text-left space-y-3">
          <p className="text-[9px] font-bold tracking-[3px] uppercase text-primary">O que acontece agora</p>
          {["Nossa equipe analisará sua candidatura em até 2 dias úteis.","Você receberá um contato pelo WhatsApp para uma conversa rápida de alinhamento.","Se aprovado, você receberá um e-mail com o link para criar sua senha e acessar a plataforma."].map((s,i)=>(
            <div key={i} className="flex items-start gap-2.5 text-sm text-foreground/60"><span className="text-primary text-[10px] mt-1 flex-shrink-0">✦</span>{s}</div>
          ))}
        </div>
        <p className="text-xs text-foreground/30 italic leading-relaxed">
          Mais do que indicar um serviço, você está abrindo caminhos e criando pontes.<br/>
          <span className="text-primary/60 not-italic font-semibold">Programa Bridges — Building bridges, changing lives.</span>
        </p>
      </div>
    </div>
  );

  return(
    <div className="min-h-screen flex flex-col items-center bg-background px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-[10px] font-bold tracking-[4px] uppercase text-primary mb-1">Quero ser Conector</p>
        <h1 className="text-2xl font-bold text-foreground">Programa <span className="text-primary italic font-light">Bridges</span></h1>
        <p className="text-xs text-foreground/40 mt-1.5 max-w-xs mx-auto leading-relaxed">Preencha as informações abaixo para enviar sua candidatura. Nossa equipe entrará em contato para os próximos passos.</p>
      </div>

      <div className="w-full max-w-lg mb-6">
        <div className="flex justify-between text-xs text-foreground/40 mb-2"><span>{STEPS[step-1]}</span><span>Bloco {step} de {STEPS.length}</span></div>
        <div className="h-[3px] bg-white/[0.07] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500" style={{width:`${((step-1)/STEPS.length)*100}%`}}/></div>
        <div className="flex gap-1.5 mt-2.5 justify-center">{STEPS.map((_,i)=><div key={i} className={`w-[7px] h-[7px] rounded-full transition-all duration-300 ${i+1<step?"bg-primary/50":i+1===step?"bg-primary shadow-[0_0_7px_rgba(201,168,76,0.6)]":"bg-white/[0.12]"}`}/>)}</div>
      </div>

      <div className="w-full max-w-lg rounded-2xl border border-primary/15 bg-card p-8 shadow-2xl space-y-5">

        {step===1&&<>
          <div><Badge n={1}/><h2 className="text-xl font-bold">Identificação Pessoal</h2><p className="text-sm text-foreground/50 mt-1">Informações básicas para registrar sua candidatura.</p></div>
          <Field label="Nome completo" required><Input value={form.nome} onChange={v=>set("nome",v)} placeholder="Seu nome completo"/></Field>
          <Field label="WhatsApp" required><Input value={form.whatsapp} onChange={v=>set("whatsapp",fmtPhone(v))} placeholder="(XX) XXXXX-XXXX"/></Field>
          <Field label="E-mail" required><Input type="email" value={form.email} onChange={v=>set("email",v)} placeholder="voce@email.com"/></Field>
          <Field label="CPF"><Input value={form.cpf} onChange={v=>set("cpf",fmtCPF(v))} placeholder="000.000.000-00"/></Field>
          <Field label="Cidade / Estado"><Input value={form.cidade} onChange={v=>set("cidade",v)} placeholder="Ex.: São Paulo, SP"/></Field>
          <Hr/>
          <Field label="Como ficou sabendo do Programa Bridges?"><Radio options={COMO_CONHECEU} value={form.como_conheceu} onChange={v=>set("como_conheceu",v)}/></Field>
          {form.como_conheceu==="Indicação de outro conector"&&<Field label="Quem indicou?"><Input value={form.indicado_por} onChange={v=>set("indicado_por",v)} placeholder="Nome de quem te indicou"/></Field>}
        </>}

        {step===2&&<>
          <div><Badge n={2}/><h2 className="text-xl font-bold">Perfil Profissional</h2><p className="text-sm text-foreground/50 mt-1">Entender seu perfil nos ajuda a direcionar materiais e treinamentos adequados.</p></div>
          <Field label="Ocupação atual" required><Sel value={form.ocupacao} onChange={v=>set("ocupacao",v)} options={OCUPACOES} placeholder="Selecione sua ocupação"/></Field>
          {form.ocupacao==="Outro"&&<Field label="Qual é a sua ocupação?"><Input value={form.outra_ocupacao} onChange={v=>set("outra_ocupacao",v)} placeholder="Descreva sua ocupação"/></Field>}
          <Field label="Tamanho estimado da sua rede de contatos"><Tip><strong className="text-primary/80">Por que perguntamos?</strong> Isso nos ajuda a entender o potencial de alcance — não é critério de seleção, mas de adequação das ferramentas de suporte.</Tip><Radio options={REDES} value={form.tamanho_rede} onChange={v=>set("tamanho_rede",v)}/></Field>
          <Field label="Já atuou como afiliado ou parceiro comercial antes?"><Radio options={["Sim","Não"]} value={form.experiencia_afiliado} onChange={v=>set("experiencia_afiliado",v)} inline/></Field>
          <Field label="Possui relacionamento com público que pode ter interesse em imigrar para os EUA?"><Tip><strong className="text-primary/80">Exemplos:</strong> comunidades profissionais, grupos de empreendedores, seguidores, pacientes, clientes, alunos etc.</Tip><Textarea value={form.relacionamento} onChange={v=>set("relacionamento",v)} placeholder="Descreva brevemente o tipo de comunidade ou rede com a qual você se relaciona..."/></Field>
        </>}

        {step===3&&<>
          <div><Badge n={3}/><h2 className="text-xl font-bold">Canais e Estratégia de Indicação</h2><p className="text-sm text-foreground/50 mt-1">Como você pretende alcançar e qualificar potenciais candidatos?</p></div>
          <Field label="Quais canais você pretende usar?" required><Check options={CANAIS_OPTS} values={form.canais} onChange={v=>set("canais",v)}/></Field>
          <Field label="Com que frequência você pretende realizar indicações?"><Radio options={FREQUENCIAS} value={form.frequencia} onChange={v=>set("frequencia",v)}/></Field>
          <Field label="Tem interesse em receber treinamentos sobre como qualificar e abordar candidatos?"><Radio options={["Sim, tenho interesse","Não é necessário"]} value={form.interesse_treinamento} onChange={v=>set("interesse_treinamento",v)} inline/></Field>
        </>}

        {step===4&&<>
          <div><Badge n={4}/><h2 className="text-xl font-bold">Dados para Pagamento de Comissão</h2><p className="text-sm text-foreground/50 mt-1">Informações necessárias para processar o pagamento das suas comissões quando aprovado.</p></div>
          <Tip><strong className="text-primary/80">Como funciona?</strong> Quando um candidato indicado por você fechar contrato, você receberá sua comissão em até 10 dias úteis. Em contratos parcelados, as comissões acompanham o mesmo parcelamento.</Tip>
          <Field label="Tipo de chave Pix" required><Radio options={TIPOS_PIX} value={form.tipo_pix} onChange={v=>set("tipo_pix",v)}/></Field>
          {form.tipo_pix&&!isTrad&&<Field label="Chave Pix"><Input value={form.chave_pix} onChange={v=>set("chave_pix",v)} placeholder="Informe sua chave Pix"/></Field>}
          {isTrad&&<><Hr/>
            <Field label="Banco"><Input value={form.banco} onChange={v=>set("banco",v)} placeholder="Nome do banco"/></Field>
            <div className="grid grid-cols-2 gap-4"><Field label="Agência"><Input value={form.agencia} onChange={v=>set("agencia",v)} placeholder="0000"/></Field><Field label="Conta (com dígito)"><Input value={form.conta} onChange={v=>set("conta",v)} placeholder="00000-0"/></Field></div>
            <Field label="Tipo de conta"><Radio options={["Corrente","Poupança"]} value={form.tipo_conta} onChange={v=>set("tipo_conta",v)} inline/></Field>
            <Field label="Titular da conta"><Input value={form.titular_conta} onChange={v=>set("titular_conta",v)} placeholder="Nome completo do titular"/></Field>
            <Field label="CPF do titular"><Input value={form.cpf_titular} onChange={v=>set("cpf_titular",fmtCPF(v))} placeholder="000.000.000-00"/></Field>
          </>}
        </>}

        {step===5&&<>
          <div><Badge n={5}/><h2 className="text-xl font-bold">Regulamento e Aceite</h2><p className="text-sm text-foreground/50 mt-1">Leia com atenção o regulamento antes de concluir sua candidatura.</p></div>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-5 max-h-72 overflow-y-auto text-xs text-foreground/60 leading-relaxed space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-primary/30 [&::-webkit-scrollbar-thumb]:rounded-full">
            {TERMOS.map(s=><div key={s.title}><p className="text-[10px] font-bold tracking-[1px] uppercase text-primary/70 mb-1.5">{s.title}</p><p>{s.body}</p></div>)}
          </div>
          <div className="space-y-3">
            <Aceite checked={form.aceite_regulamento} onToggle={()=>set("aceite_regulamento",!form.aceite_regulamento)}>
              <strong className="text-foreground">Li e concordo com o Regulamento do Programa Bridges</strong> — declaro estar ciente das regras de conduta, captação, comissionamento e rescisão. <span className="text-primary">*</span>
            </Aceite>
            <Aceite checked={form.aceite_whatsapp} onToggle={()=>set("aceite_whatsapp",!form.aceite_whatsapp)}>
              <strong className="text-foreground">Aceito participar do grupo de WhatsApp do Programa Bridges</strong> e receber comunicações, materiais e atualizações do programa. <span className="text-primary">*</span>
            </Aceite>
          </div>
          {error&&<div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        </>}

        <div className="flex gap-3 pt-2">
          {step>1&&<button onClick={()=>setStep(s=>s-1)} disabled={saving} className="flex-1 py-3 rounded-lg border border-border text-sm text-foreground/60 hover:border-primary/40 hover:text-foreground transition-colors">← Voltar</button>}
          {step<5
            ?<button onClick={()=>setStep(s=>s+1)} disabled={!ok[step]} className="flex-1 py-3 rounded-lg bg-primary text-background font-semibold text-sm tracking-wide hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Continuar →</button>
            :<button onClick={submit} disabled={!ok[5]||saving} className="flex-1 py-3 rounded-lg bg-primary text-background font-semibold text-sm tracking-wide hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">{saving?"Enviando candidatura...":"Enviar candidatura ✦"}</button>
          }
        </div>
      </div>

      <p className="text-sm text-foreground/40 mt-6">Já tem conta?{" "}<Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">Fazer login</Link></p>
    </div>
  );
};

export default RegisterConector;
