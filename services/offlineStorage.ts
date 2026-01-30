import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from '../constants/Configs';
import { Lead, LeadFormData } from '../types';

export const getStoredLeads = async (): Promise<Lead[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (!jsonValue) {
      return [];
    }

    const parsed = JSON.parse(jsonValue) as Lead[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveLeadLocally = async (data: LeadFormData): Promise<boolean> => {
  try {
    const existing = await getStoredLeads();

    const newLead: Lead = {
      ...data,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      funil_de_origem: 'inbound',
    };

    const updated = [...existing, newLead];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('Erro ao salvar local', e);
    return false;
  }
};

export const clearStoredLeads = async (leadsToKeep: Lead[] = []): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(leadsToKeep));
  } catch (e) {
    console.error('Erro ao limpar', e);
  }
};