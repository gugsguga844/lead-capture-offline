import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { clearStoredLeads, getStoredLeads } from '../services/offlineStorage';
import { Lead, LeadFormData } from '../types';

const VENDEDORES = [
  'Kesley Oliveira',
  'Alexsandy Corrêa',
  'Jehnnifer Padilha',
  'Lucio Ramos',
  'Matheus Gerik',
  'Thomas Ferreira',
];

const FAIXAS_FUNCIONARIOS = [
  '1',
  '2 a 5',
  '6 a 20',
  '21 a 100',
  '101 a 500',
  '+501',
];

const PRODUTOS = [
  'Core',
  'Planejamento Estratégico',
  'Agentes IA',
];

export default function OfflineLeadsScreen() {
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadFormData | null>(null);

  const totalLeads = leads.length;
  const pendingLeads = leads.filter((lead) => !lead.synced).length;
  const syncedLeads = totalLeads - pendingLeads;

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setIsLoading(true);
    const stored = await getStoredLeads();
    setLeads(stored);
    setIsLoading(false);
  };

  const handleDelete = (lead: Lead) => {
    Alert.alert(
      'Excluir lead',
      'Tem certeza que deseja remover este lead da fila offline?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const updated = leads.filter((l) => l.id !== lead.id);
            await clearStoredLeads(updated);
            setLeads(updated);
          },
        },
      ],
    );
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      vendedor: lead.vendedor,
      nome: lead.nome,
      email: lead.email,
      telefone: lead.telefone,
      empresa: lead.empresa,
      numero_de_funcionarios: lead.numero_de_funcionarios,
      observacoes: lead.observacoes,
      produto: lead.produto,
    });
  };

  const closeEdit = () => {
    setEditingLead(null);
    setForm(null);
  };

  const handleChange = (field: keyof LeadFormData, value: string) => {
    if (!form) return;
    setForm({ ...form, [field]: value });
  };

  const handleSaveEdit = async () => {
    if (!editingLead || !form) return;

    if (!form.vendedor || !form.nome || !form.email || !form.telefone || !form.empresa || !form.numero_de_funcionarios) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos obrigatórios.');
      return;
    }

    const updatedLead: Lead = {
      ...editingLead,
      ...form,
    };

    const updatedList = leads.map((l) => (l.id === updatedLead.id ? updatedLead : l));
    await clearStoredLeads(updatedList);
    setLeads(updatedList);
    closeEdit();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#010C14' }}>
      <StatusBar barStyle="light-content" backgroundColor="#010C14" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Voltar'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Fila Offline</Text>
        <Text style={styles.subtitle}>Leads salvos no dispositivo</Text>
        {totalLeads > 0 && (
          <Text style={styles.summaryText}>
            Total: {totalLeads} · Pendentes: {pendingLeads} · Sincronizados: {syncedLeads}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      ) : leads.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Nenhum lead offline no momento.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {leads.map((lead) => (
            <View key={lead.id} style={styles.card}>
              <Text style={styles.cardTitle}>{lead.nome}</Text>
              <Text style={styles.cardSubtitle}>{lead.email}</Text>
              <View style={styles.statusBadgeRow}>
                <View style={lead.synced ? styles.syncedBadge : styles.pendingBadge}>
                  <Text style={lead.synced ? styles.syncedBadgeText : styles.pendingBadgeText}>
                    {lead.synced ? 'Sincronizado' : 'Pendente'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardLine}>Empresa: {lead.empresa}</Text>
              <Text style={styles.cardLine}>Vendedor: {lead.vendedor}</Text>
              <Text style={styles.cardLine}>Funcionários: {lead.numero_de_funcionarios}</Text>
              <Text style={styles.cardLine}>Criado em: {new Date(lead.timestamp).toLocaleString()}</Text>

              <View style={styles.cardActions}>
                {!lead.synced && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEdit(lead)}
                  >
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(lead)}
                >
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={!!editingLead}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar lead</Text>

            {form && (
              <ScrollView>
                <Text style={styles.label}>Vendedor *</Text>
                <View style={styles.selectContainer}>
                  {VENDEDORES.map((vend) => (
                    <TouchableOpacity
                      key={vend}
                      style={[
                        styles.optionButton,
                        form.vendedor === vend && styles.optionButtonSelected,
                      ]}
                      onPress={() => handleChange('vendedor', vend)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          form.vendedor === vend && styles.optionButtonTextSelected,
                        ]}
                      >
                        {vend}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  value={form.nome}
                  onChangeText={(text) => handleChange('nome', text)}
                  placeholder="Nome"
                  placeholderTextColor="#9EA7B3"
                />

                <Text style={styles.label}>E-mail *</Text>
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(text) => handleChange('email', text)}
                  placeholder="E-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9EA7B3"
                />

                <Text style={styles.label}>Telefone *</Text>
                <TextInput
                  style={styles.input}
                  value={form.telefone}
                  onChangeText={(text) => handleChange('telefone', text)}
                  placeholder="Telefone"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9EA7B3"
                />

                <Text style={styles.label}>Nome da empresa *</Text>
                <TextInput
                  style={styles.input}
                  value={form.empresa}
                  onChangeText={(text) => handleChange('empresa', text)}
                  placeholder="Nome da empresa"
                  placeholderTextColor="#9EA7B3"
                />

                <Text style={styles.label}>Número de funcionários *</Text>
                <View style={styles.selectContainer}>
                  {FAIXAS_FUNCIONARIOS.map((faixa) => (
                    <TouchableOpacity
                      key={faixa}
                      style={[
                        styles.optionButton,
                        form.numero_de_funcionarios === faixa && styles.optionButtonSelected,
                      ]}
                      onPress={() => handleChange('numero_de_funcionarios', faixa)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          form.numero_de_funcionarios === faixa && styles.optionButtonTextSelected,
                        ]}
                      >
                        {faixa}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Observações</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.observacoes || ''}
                  onChangeText={(text) => handleChange('observacoes', text)}
                  placeholder="Observações"
                  placeholderTextColor="#9EA7B3"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={styles.label}>Produto</Text>
                <View style={styles.selectContainer}>
                  {PRODUTOS.map((prod) => (
                    <TouchableOpacity
                      key={prod}
                      style={[
                        styles.optionButton,
                        form.produto === prod && styles.optionButtonSelected,
                      ]}
                      onPress={() => handleChange('produto', prod)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          form.produto === prod && styles.optionButtonTextSelected,
                        ]}
                      >
                        {prod}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeEdit}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.saveButtonText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#010C14',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#FFBB28',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFBB28',
    fontFamily: 'PPNeueMachina-Ultrabold',
  },
  subtitle: {
    fontSize: 14,
    color: '#9EA7B3',
    marginTop: 4,
  },
  summaryText: {
    fontSize: 13,
    color: '#9EA7B3',
    marginTop: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9EA7B3',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#0B1924',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E2D38',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9EA7B3',
    marginBottom: 8,
  },
  cardLine: {
    fontSize: 13,
    color: '#9EA7B3',
  },
  statusBadgeRow: {
    marginTop: 6,
    marginBottom: 8,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#FFBB28',
    borderWidth: 1,
    borderColor: '#FFCD62',
  },
  pendingBadgeText: {
    color: '#0B1924',
    fontSize: 11,
    fontWeight: '600',
  },
  syncedBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#1E2D38',
    borderWidth: 1,
    borderColor: '#2E4A5F',
  },
  syncedBadgeText: {
    color: '#9EA7B3',
    fontSize: 11,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFCD62',
    marginRight: 8,
  },
  editButtonText: {
    color: '#FFBB28',
    fontSize: 14,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#d32f2f',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0B1924',
    borderRadius: 16,
    maxHeight: '90%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2D38',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#1E2D38',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 15,
    backgroundColor: '#0B1924',
    color: '#FFFFFF',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#1E2D38',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#0B1924',
  },
  optionButtonSelected: {
    backgroundColor: '#FFBB28',
    borderColor: '#FFCD62',
  },
  optionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  optionButtonTextSelected: {
    color: '#0B1924',
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#9EA7B3',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#FFBB28',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCD62',
  },
  saveButtonText: {
    color: '#0B1924',
    fontSize: 14,
    fontWeight: '600',
  },
});
