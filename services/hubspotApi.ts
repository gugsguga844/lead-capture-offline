import axios from 'axios';
import { HUBSPOT_CONFIG } from '../constants/Configs';
import { Lead } from '../types';

const formatPhoneForHubSpot = (rawPhone?: string | null): string => {
  if (!rawPhone) return '';

  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  // Se já começar com 55, apenas adiciona o + na frente
  if (digits.startsWith('55')) {
    return `+${digits}`;
  }

  // Caso contrário, prefixa com 55
  return `+55${digits}`;
};

export const sendToHubSpot = async (lead: Lead): Promise<boolean> => {
  const url = `${HUBSPOT_CONFIG.BASE_URL}/${HUBSPOT_CONFIG.PORTAL_ID}/${HUBSPOT_CONFIG.FORM_GUID}`;
  
  const payload = {
    fields: [
      { name: 'firstname', value: lead.nome || '' },
      { name: 'email', value: lead.email || '' },
      { name: 'phone', value: formatPhoneForHubSpot(lead.telefone) },
      { name: 'observacoes', value: lead.observacoes || '' },

      // Campos adicionais obrigatórios no formulário HubSpot
      { name: 'aceita_receber_diagnostico_via_email', value: 'true' },
      { name: '0-2/name', value: lead.empresa || '' },
      { name: '0-2/numero_de_funcionarios', value: lead.numero_de_funcionarios || '' },
      { name: '0-2/vendedor', value: lead.vendedor || '' },
      { name: '0-2/produto', value: lead.produto || '' },
      { name: '0-2/funil_de_origem', value: lead.funil_de_origem || 'inbound' },
    ],
    context: {
      pageUri: "app://3c-leads-offline",
      pageName: "3C Leads"
    }
  };

  try {
    const response = await axios.post(url, payload);
    return response.status === 200;
  } catch (error: any) {
    // O 'any' aqui é seguro pois erro de axios varia muito
    console.error("Erro API HubSpot", error.response?.data || error.message);
    return false;
  }
};