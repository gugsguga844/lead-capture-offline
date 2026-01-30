import axios from 'axios';
import { HUBSPOT_CONFIG } from '../constants/Configs';
import { Lead } from '../types';

export const sendToHubSpot = async (lead: Lead): Promise<boolean> => {
  const url = `${HUBSPOT_CONFIG.BASE_URL}/${HUBSPOT_CONFIG.PORTAL_ID}/${HUBSPOT_CONFIG.FORM_GUID}`;
  
  const payload = {
    fields: [
      { name: 'vendedor', value: lead.vendedor || '' },
      { name: 'firstname', value: lead.nome || '' },
      { name: 'email', value: lead.email || '' },
      { name: 'phone', value: lead.telefone || '' },
      { name: 'numero_de_funcionarios', value: lead.numero_de_funcionarios || '' },
      { name: 'observacoes', value: lead.observacoes || '' },
      { name: 'produto', value: lead.produto || '' },
      { name: 'funil_de_origem', value: lead.funil_de_origem || 'inbound' },

      // Campos adicionais obrigatórios no formulário HubSpot
      { name: 'aceita_receber_diagnostico_via_email', value: 'true' },
      { name: '0-2/name', value: lead.empresa || '' },
      { name: '0-2/numero_de_funcionarios', value: lead.numero_de_funcionarios || '' },
    ],
    context: {
      pageUri: "www.grupo3c.com.br/evento-offline",
      pageName: "App Captura Mobile"
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