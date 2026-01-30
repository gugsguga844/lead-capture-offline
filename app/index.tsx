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

import * as Network from 'expo-network';
import { Stack, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { sendToHubSpot } from '../services/hubspotApi';
import { clearStoredLeads, getStoredLeads, saveLeadLocally } from '../services/offlineStorage';
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

export default function LeadCaptureScreen() {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<LeadFormData>();
  
  const router = useRouter();
  const [queueSize, setQueueSize] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isVendedorOpen, setIsVendedorOpen] = useState(false);
  const [vendedorSearch, setVendedorSearch] = useState('');
  const [isFaixaOpen, setIsFaixaOpen] = useState(false);
  const [faixaSearch, setFaixaSearch] = useState('');

  const filteredVendedores = VENDEDORES.filter((vend) =>
    vend.toLowerCase().includes(vendedorSearch.toLowerCase()),
  );

  const filteredFaixas = FAIXAS_FUNCIONARIOS.filter((faixa) =>
    faixa.toLowerCase().includes(faixaSearch.toLowerCase()),
  );

  useEffect(() => {
    updateQueueCount();
  }, []);

  const updateQueueCount = async () => {
    const leads = await getStoredLeads();
    setQueueSize(leads.length);
  };

  const onSave = async (data: LeadFormData) => {
    const saved = await saveLeadLocally(data);
    if (saved) {
      Alert.alert("Sucesso", "Lead salvo no dispositivo!");
      reset();
      updateQueueCount();
    } else {
      Alert.alert("Erro", "Falha ao salvar lead.");
    }
  };

  const onSync = async () => {
    const netState = await Network.getNetworkStateAsync();
    
    if (!netState.isConnected || !netState.isInternetReachable) {
      Alert.alert("Sem Conexão", "Conecte-se à internet para enviar os dados.");
      return;
    }

    setIsSyncing(true);
    const leads = await getStoredLeads();
    
    if (leads.length === 0) {
      Alert.alert("Vazio", "Nenhum lead para enviar.");
      setIsSyncing(false);
      return;
    }

    let successCount = 0;
    const failedLeads: Lead[] = [];

    for (const lead of leads) {
      const success = await sendToHubSpot(lead);
      if (success) {
        successCount++;
      } else {
        failedLeads.push(lead);
      }
    }

    await clearStoredLeads(failedLeads);
    setQueueSize(failedLeads.length);
    setIsSyncing(false);

    if (failedLeads.length > 0) {
      Alert.alert("Atenção", `${successCount} enviados. ${failedLeads.length} falharam.`);
    } else {
      Alert.alert("Sucesso Total!", `${successCount} leads enviados!`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#010C14' }}>
      <StatusBar barStyle="light-content" backgroundColor="#010C14" />
      <Stack.Screen options={{ title: '3C Leads', headerShown: false }} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>G4 Frontier</Text>
          <Text style={styles.subtitle}>Grupo 3C</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusText}>
              Fila Offline: <Text style={{fontWeight: 'bold'}}>{queueSize}</Text>
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.syncButton, (queueSize === 0 || isSyncing) && styles.disabledButton]} 
            onPress={onSync}
            disabled={queueSize === 0 || isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.syncButtonText}>Sincronizar Nuvem</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manageQueueButton}
            onPress={() => router.push('/offline-leads')}
          >
            <Text style={styles.manageQueueText}>Gerenciar fila offline</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View>
            <Text style={styles.label}>Vendedor *</Text>
            <Controller
              control={control}
              name="vendedor"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setIsVendedorOpen(true)}
                  >
                    <Text
                      style={
                        value ? styles.dropdownValue : styles.dropdownPlaceholder
                      }
                    >
                      {value || 'Selecionar vendedor'}
                    </Text>
                  </TouchableOpacity>

                  <Modal
                    visible={isVendedorOpen}
                    transparent
                    animationType="slide"
                    onRequestClose={() => {
                      setIsVendedorOpen(false);
                      setVendedorSearch('');
                    }}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Vendedor</Text>
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Pesquisar"
                          placeholderTextColor="#9EA7B3"
                          value={vendedorSearch}
                          onChangeText={setVendedorSearch}
                        />
                        <ScrollView>
                          {filteredVendedores.map((vend) => (
                            <TouchableOpacity
                              key={vend}
                              style={styles.modalOption}
                              onPress={() => {
                                onChange(vend);
                                setIsVendedorOpen(false);
                                setVendedorSearch('');
                              }}
                            >
                              <Text style={styles.modalOptionText}>{vend}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        <TouchableOpacity
                          style={styles.modalCloseButton}
                          onPress={() => {
                            setIsVendedorOpen(false);
                            setVendedorSearch('');
                          }}
                        >
                          <Text style={styles.modalCloseButtonText}>Fechar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                </>
              )}
            />
            {errors.vendedor && <Text style={styles.error}>Obrigatório</Text>}
          </View>

          <View>
            <Text style={styles.label}>Nome *</Text>
            <Controller
              control={control}
              rules={{ required: true }}
              name="nome"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Ex: João Silva"
                  placeholderTextColor="#9EA7B3"
                />
              )}
            />
            {errors.nome && <Text style={styles.error}>Obrigatório</Text>}
          </View>

          <View>
            <Text style={styles.label}>E-mail *</Text>
            <Controller
              control={control}
              rules={{ required: true }}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="joao@empresa.com"
                  placeholderTextColor="#9EA7B3"
                />
              )}
            />
            {errors.email && <Text style={styles.error}>Obrigatório</Text>}
          </View>

          <View>
            <Text style={styles.label}>Telefone *</Text>
            <Controller
              control={control}
              name="telefone"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#9EA7B3"
                />
              )}
            />
            {errors.telefone && <Text style={styles.error}>Obrigatório</Text>}
          </View>

          <View>
            <Text style={styles.label}>Nome da empresa *</Text>
            <Controller
              control={control}
              name="empresa"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Ex: Grupo 3C"
                  placeholderTextColor="#9EA7B3"
                />
              )}
            />
            {errors.empresa && <Text style={styles.error}>Obrigatório</Text>}
          </View>

          <View>
            <Text style={styles.label}>Número de funcionários *</Text>
            <Controller
              control={control}
              name="numero_de_funcionarios"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setIsFaixaOpen(true)}
                  >
                    <Text
                      style={
                        value ? styles.dropdownValue : styles.dropdownPlaceholder
                      }
                    >
                      {value || 'Selecionar número de funcionários'}
                    </Text>
                  </TouchableOpacity>

                  <Modal
                    visible={isFaixaOpen}
                    transparent
                    animationType="slide"
                    onRequestClose={() => {
                      setIsFaixaOpen(false);
                      setFaixaSearch('');
                    }}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Número de funcionários</Text>
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Pesquisar"
                          placeholderTextColor="#9EA7B3"
                          value={faixaSearch}
                          onChangeText={setFaixaSearch}
                        />
                        <ScrollView>
                          {filteredFaixas.map((faixa) => (
                            <TouchableOpacity
                              key={faixa}
                              style={styles.modalOption}
                              onPress={() => {
                                onChange(faixa);
                                setIsFaixaOpen(false);
                                setFaixaSearch('');
                              }}
                            >
                              <Text style={styles.modalOptionText}>{faixa}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        <TouchableOpacity
                          style={styles.modalCloseButton}
                          onPress={() => {
                            setIsFaixaOpen(false);
                            setFaixaSearch('');
                          }}
                        >
                          <Text style={styles.modalCloseButtonText}>Fechar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
                </>
              )}
            />
            {errors.numero_de_funcionarios && (
              <Text style={styles.error}>Obrigatório</Text>
            )}
          </View>

          <View>
            <Text style={styles.label}>Observações</Text>
            <Controller
              control={control}
              name="observacoes"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Informações adicionais sobre o lead"
                  placeholderTextColor="#9EA7B3"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />

          </View>

          <View>
            <Text style={styles.label}>Produto</Text>
            <Controller
              control={control}
              name="produto"
              render={({ field: { onChange, value } }) => (
                <View style={styles.selectContainer}>
                  {PRODUTOS.map((prod) => (
                    <TouchableOpacity
                      key={prod}
                      style={[
                        styles.optionButton,
                        value === prod && styles.optionButtonSelected,
                      ]}
                      onPress={() => onChange(prod)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          value === prod && styles.optionButtonTextSelected,
                        ]}
                      >
                        {prod}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.produto && <Text style={styles.error}>Obrigatório</Text>}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSubmit(onSave)}>
            <Text style={styles.saveButtonText}>Salvar (Offline)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50 },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFBB28', fontFamily: 'PPNeueMachina-Ultrabold' },
  subtitle: { fontSize: 16, color: '#9EA7B3', marginTop: 4 },
  statusCard: { 
    backgroundColor: '#0B1924', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 25, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2D38',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  statusTextContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: { fontSize: 16, marginBottom: 12, color: '#FFFFFF' },
  syncButton: { 
    backgroundColor: '#FFBB28', 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 12, 
    width: '100%', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCD62',
  },
  disabledButton: { backgroundColor: '#1E2D38', borderColor: '#1E2D38' },
  syncButtonText: { color: '#0B1924', fontWeight: 'bold', fontSize: 16 },
  manageQueueButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  manageQueueText: {
    color: '#FFBB28',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: { 
    backgroundColor: '#0B1924', 
    padding: 24, 
    borderRadius: 16, 
    borderWidth: 1,
    borderColor: '#1E2D38',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#FFFFFF' },
  input: { 
    borderWidth: 1, 
    borderColor: '#1E2D38', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 12, 
    fontSize: 16,
    backgroundColor: '#0B1924',
    color: '#FFFFFF',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#1E2D38',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: '#0B1924',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#9EA7B3',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#1E2D38',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    fontSize: 14,
  },
  optionButtonTextSelected: {
    color: '#0B1924',
    fontWeight: '600',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
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
    maxHeight: '80%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2D38',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FFBB28',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#1E2D38',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12, 
    backgroundColor: '#0B1924',
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalCloseButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCloseButtonText: {
    color: '#FFBB28',
    fontSize: 14,
    fontWeight: '600',
  },
  error: { color: '#FF5A5F', fontSize: 12, marginBottom: 10, marginTop: -8 },
  saveButton: { 
    backgroundColor: '#FFBB28', 
    padding: 16, 
    borderRadius: 12, 
    marginTop: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCD62',
  },
  saveButtonText: { color: '#0B1924', fontSize: 16, fontWeight: 'bold' }
});