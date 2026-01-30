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

export default function OfflineLeadsScreen() {
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadFormData | null>(null);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Voltar'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Fila Offline</Text>
        <Text style={styles.subtitle}>Leads salvos no dispositivo</Text>
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
              <Text style={styles.cardLine}>Empresa: {lead.empresa}</Text>
              <Text style={styles.cardLine}>Vendedor: {lead.vendedor}</Text>
              <Text style={styles.cardLine}>Funcionários: {lead.numero_de_funcionarios}</Text>
              <Text style={styles.cardLine}>Criado em: {new Date(lead.timestamp).toLocaleString()}</Text>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEdit(lead)}
                >
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
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
                <TextInput
                  style={styles.input}
                  value={form.vendedor}
                  onChangeText={(text) => handleChange('vendedor', text)}
                  placeholder="Vendedor"
                />

                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  value={form.nome}
                  onChangeText={(text) => handleChange('nome', text)}
                  placeholder="Nome"
                />

                <Text style={styles.label}>E-mail *</Text>
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(text) => handleChange('email', text)}
                  placeholder="E-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Telefone *</Text>
                <TextInput
                  style={styles.input}
                  value={form.telefone}
                  onChangeText={(text) => handleChange('telefone', text)}
                  placeholder="Telefone"
                  keyboardType="phone-pad"
                />

                <Text style={styles.label}>Nome da empresa *</Text>
                <TextInput
                  style={styles.input}
                  value={form.empresa}
                  onChangeText={(text) => handleChange('empresa', text)}
                  placeholder="Nome da empresa"
                />

                <Text style={styles.label}>Número de funcionários *</Text>
                <TextInput
                  style={styles.input}
                  value={form.numero_de_funcionarios}
                  onChangeText={(text) => handleChange('numero_de_funcionarios', text)}
                  placeholder="Número de funcionários"
                />

                <Text style={styles.label}>Observações</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.observacoes || ''}
                  onChangeText={(text) => handleChange('observacoes', text)}
                  placeholder="Observações"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={styles.label}>Produto</Text>
                <TextInput
                  style={styles.input}
                  value={form.produto || ''}
                  onChangeText={(text) => handleChange('produto', text)}
                  placeholder="Produto"
                />

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
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#1976d2',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  cardLine: {
    fontSize: 13,
    color: '#555',
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
    borderColor: '#1976d2',
    marginRight: 8,
  },
  editButtonText: {
    color: '#1976d2',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '90%',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
    color: '#424242',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 15,
    backgroundColor: '#fafafa',
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
    color: '#555',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
