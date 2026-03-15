export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string | null;
          email: string | null;
          role: string | null;
          status: string | null;
          created_at: string | null;
          whatsapp: string | null;
          cpf: string | null;
          cidade: string | null;
          como_conheceu: string | null;
          linkedin: string | null;
          instagram: string | null;
          indicado_por: string | null;
          indicado_por_profile_id: string | null;
          ocupacao: string | null;
          tamanho_rede: string | null;
          experiencia_afiliado: string | null;
          relacionamento: string | null;
          canais_indicacao: Json | null;
          frequencia_indicacoes: string | null;
          interesse_treinamento: string | null;
          tipo_pix: string | null;
          chave_pix: string | null;
          banco: string | null;
          agencia: string | null;
          conta: string | null;
          tipo_conta: string | null;
          titular_conta: string | null;
          cpf_titular: string | null;
          aceite_regulamento: boolean;
          aceite_whatsapp: boolean;
          aceite_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at"> & { created_at?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          conector_id: string | null;
          consultor: string | null;
          nome: string;
          email: string | null;
          whatsapp: string | null;
          cidade: string | null;
          idade: string | null;
          area: string | null;
          experiencia: string | null;
          cargo: string | null;
          vinculo: string | null;
          operacao_eua: string | null;
          visto: string | null;
          nivel_elegibilidade: string | null;
          justificativa: string | null;
          motivacao: string | null;
          familiar_eua: string | null;
          tentativa_anterior: string | null;
          nivel_decisao: number | null;
          canal: string | null;
          indicador: string | null;
          duvidas: string | null;
          status_pipeline: string | null;
          created_at: string | null;
          arquivado: boolean;
          motivo_exclusao: string | null;
          arquivado_at: string | null;
          passou_por_disponivel: boolean;
          assumido_por_id: string | null;
          assumido_at: string | null;
          cenario_comissao: number | null;
        };
        Insert: Omit<Database["public"]["Tables"]["leads"]["Row"], "id" | "created_at" | "arquivado" | "passou_por_disponivel"> & {
          id?: string;
          created_at?: string;
          arquivado?: boolean;
          passou_por_disponivel?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      comissoes: {
        Row: {
          id: string;
          lead_id: string | null;
          conector_id: string | null;
          valor_previsto: number | null;
          valor_liberado: number | null;
          valor_pago: number | null;
          status: "pendente" | "liberado" | "pago" | null;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["comissoes"]["Row"], "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["comissoes"]["Insert"]>;
      };
      lead_evidencias: {
        Row: {
          id: string;
          lead_id: string | null;
          criterio: string | null;
          checked: boolean | null;
        };
        Insert: Omit<Database["public"]["Tables"]["lead_evidencias"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["lead_evidencias"]["Insert"]>;
      };
      pipeline_stages: {
        Row: {
          id: string;
          lead_id: string | null;
          stage: string | null;
          moved_by: string | null;
          moved_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["pipeline_stages"]["Row"], "id" | "moved_at"> & { id?: string; moved_at?: string };
        Update: Partial<Database["public"]["Tables"]["pipeline_stages"]["Insert"]>;
      };
      equipes: {
        Row: {
          id: string;
          nome: string;
          lider_id: string;
          supervisor_id: string | null;
          ativa: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["equipes"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["equipes"]["Insert"]>;
      };
      equipe_membros: {
        Row: {
          id: string;
          equipe_id: string;
          conector_id: string;
          joined_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["equipe_membros"]["Row"], "id" | "joined_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["equipe_membros"]["Insert"]>;
      };
      candidaturas: {
        Row: {
          id: string;
          nome: string;
          whatsapp: string;
          email: string;
          cpf: string | null;
          cidade: string | null;
          como_conheceu: string | null;
          indicado_por: string | null;
          indicado_por_profile_id: string | null;
          ocupacao: string | null;
          tamanho_rede: string | null;
          experiencia_afiliado: string | null;
          relacionamento: string | null;
          canais_indicacao: string[] | null;
          frequencia_indicacoes: string | null;
          interesse_treinamento: string | null;
          tipo_pix: string | null;
          chave_pix: string | null;
          banco: string | null;
          agencia: string | null;
          conta: string | null;
          tipo_conta: string | null;
          titular_conta: string | null;
          cpf_titular: string | null;
          aceite_regulamento: boolean;
          aceite_whatsapp: boolean;
          aceite_at: string | null;
          status: "pendente" | "em_entrevista" | "aprovado" | "rejeitado";
          notas_admin: string | null;
          convidado_at: string | null;
          rejeitado_at: string | null;
          motivo_rejeicao: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["candidaturas"]["Row"], "id" | "created_at" | "updated_at" | "status"> & { id?: string; status?: string };
        Update: Partial<Database["public"]["Tables"]["candidaturas"]["Insert"]>;
      };
      academy_categorias: {
        Row: {
          id: string;
          nome: string;
          descricao: string | null;
          ordem: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["academy_categorias"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["academy_categorias"]["Insert"]>;
      };
      academy_conteudos: {
        Row: {
          id: string;
          categoria_id: string | null;
          titulo: string;
          descricao: string | null;
          tipo: "video" | "documento" | "ebook" | "link";
          url: string | null;
          arquivo_path: string | null;
          thumbnail: string | null;
          destaque: boolean;
          publicado: boolean;
          ordem: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["academy_conteudos"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["academy_conteudos"]["Insert"]>;
      };
    };
  };
}

// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

export type Profile         = Database["public"]["Tables"]["profiles"]["Row"];
export type Lead            = Database["public"]["Tables"]["leads"]["Row"];
export type Comissao        = Database["public"]["Tables"]["comissoes"]["Row"];
export type LeadEvidencia   = Database["public"]["Tables"]["lead_evidencias"]["Row"];
export type PipelineStage   = Database["public"]["Tables"]["pipeline_stages"]["Row"];
export type Equipe          = Database["public"]["Tables"]["equipes"]["Row"];
export type EquipeMembro    = Database["public"]["Tables"]["equipe_membros"]["Row"];
export type Candidatura     = Database["public"]["Tables"]["candidaturas"]["Row"];
export type AcademyCategoria = Database["public"]["Tables"]["academy_categorias"]["Row"];
export type AcademyConteudo  = Database["public"]["Tables"]["academy_conteudos"]["Row"];

// Roles disponíveis
export type Role = "admin" | "estrategista" | "lider" | "conector";

// Status do pipeline
export type PipelineStageValue =
  | "Lead Indicado"
  | "Em Qualificação"
  | "Lead Disponível"
  | "Reunião Agendada"
  | "Proposta Enviada"
  | "Contrato Assinado"
  | "Entrada Paga";
