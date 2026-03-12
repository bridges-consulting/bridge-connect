export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string | null;
          email: string | null;
          role: "admin" | "conector";
          status: "ativo" | "inativo";
          created_at: string;
        };
        Insert: {
          id: string;
          nome?: string | null;
          email?: string | null;
          role?: "admin" | "conector";
          status?: "ativo" | "inativo";
          created_at?: string;
        };
        Update: {
          nome?: string | null;
          email?: string | null;
          role?: "admin" | "conector";
          status?: "ativo" | "inativo";
        };
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
          status_pipeline: string;
          // soft delete
          arquivado: boolean;
          motivo_exclusao: string | null;
          arquivado_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["leads"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      lead_evidencias: {
        Row: {
          id: string;
          lead_id: string;
          criterio: string | null;
          checked: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["lead_evidencias"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["lead_evidencias"]["Insert"]>;
      };
      pipeline_stages: {
        Row: {
          id: string;
          lead_id: string;
          stage: string | null;
          moved_by: string | null;
          moved_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["pipeline_stages"]["Row"], "id" | "moved_at"> & {
          id?: string;
          moved_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pipeline_stages"]["Insert"]>;
      };
      comissoes: {
        Row: {
          id: string;
          lead_id: string;
          conector_id: string | null;
          valor_previsto: number;
          valor_liberado: number;
          valor_pago: number;
          status: "pendente" | "liberado" | "pago";
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["comissoes"]["Row"], "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["comissoes"]["Insert"]>;
      };
      candidato_status: {
        Row: {
          id: string;
          lead_id: string;
          etapa_atual: string | null;
          etapas_concluidas: string[] | null;
          docs_pendentes: string[] | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["candidato_status"]["Row"], "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["candidato_status"]["Insert"]>;
      };
    };
  };
}

// Tipos auxiliares para uso nos componentes
export type Profile        = Database["public"]["Tables"]["profiles"]["Row"];
export type Lead           = Database["public"]["Tables"]["leads"]["Row"];
export type LeadEvidencia  = Database["public"]["Tables"]["lead_evidencias"]["Row"];
export type PipelineStage  = Database["public"]["Tables"]["pipeline_stages"]["Row"];
export type Comissao       = Database["public"]["Tables"]["comissoes"]["Row"];
export type CandidatoStatus = Database["public"]["Tables"]["candidato_status"]["Row"];
