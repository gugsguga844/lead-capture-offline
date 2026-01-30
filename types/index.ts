export type LeadFormData = {
  vendedor: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  numero_de_funcionarios: string;
  observacoes?: string;
  produto?: string;
};

export type Lead = LeadFormData & {
  id: number;
  timestamp: string;
  funil_de_origem: string;
};

