## 3C Leads – Offline Lead Capture

Aplicativo mobile para captação de leads em eventos presenciais, com arquitetura **offline-first** e sincronização posterior com o HubSpot.

- Foco inicial: evento **G4 Frontier** (MVP).
- Objetivo: permitir que o time comercial cadastre leads mesmo sem internet (4G/5G ou Wi‑Fi), garantindo que **nenhum lead se perca**.

---

## Visão geral

- **Plataforma**: React Native + Expo (managed workflow)
- **Linguagem**: TypeScript
- **Roteamento**: `expo-router`
- **Formulário**: `react-hook-form`
- **Storage offline**: `@react-native-async-storage/async-storage`
- **Conectividade**: `expo-network`
- **HTTP client**: `axios`
- **Safe areas / notch**: `react-native-safe-area-context`

---

## Funcionalidades principais

- **Formulário nativo offline**
  - Campos obrigatórios alinhados ao formulário do HubSpot.
  - Validação via `react-hook-form`.

- **Persistência local de leads**
  - Cada envio de formulário salva um `Lead` em `AsyncStorage`.
  - Fila local identificada por `STORAGE_KEY`.

- **Fila offline com gestão**
  - Tela de **Fila Offline** lista todos os leads pendentes.
  - Possível **editar** ou **excluir** leads locais antes de sincronizar.

- **Sincronização com HubSpot**
  - Verifica conexão via `expo-network`.
  - Envia cada lead para o endpoint de submissão de formulários (`api.hsforms.com`).
  - Em caso de sucesso, o lead é removido da fila local.
  - Em caso de erro, o lead permanece para nova tentativa.

---

## Fluxo de dados (resumo)

### 1. Cadastro offline

- Usuário abre o app na tela `LeadCaptureScreen`.
- Preenche os campos obrigatórios e opcionais.
- Ao tocar em **"Salvar (Offline)"**:
  - Validação dos campos via `react-hook-form`.
  - Geração de `id` (`Date.now()`) e `timestamp` (`new Date().toISOString()`).
  - Criação de objeto `Lead` com `funil_de_origem = "inbound"`.
  - Salvamento no `AsyncStorage` através de `saveLeadLocally`.
  - Contador **Fila Offline** é atualizado.

### 2. Sincronização com HubSpot

- Botão **"Sincronizar Nuvem"** na tela principal.
- Fluxo:
  1. Verifica conectividade (`Network.getNetworkStateAsync`).
  2. Lê todos os leads da fila (`getStoredLeads`).
  3. Para cada lead, chama `sendToHubSpot(lead)`.
  4. Monta uma lista de sucessos e falhas.
  5. Persiste novamente somente os que falharam (`clearStoredLeads`).
  6. Exibe alerta resumindo o resultado.

### 3. Gestão da fila offline

- Botão **"Ver / editar fila offline"** na tela principal.
- Leva para `OfflineLeadsScreen` (`app/offline-leads.tsx`).
- Nessa tela é possível:
  - Ver detalhes básicos de cada lead.
  - **Editar** campos e salvar.
  - **Excluir** leads indesejados/antigos.

---

## Estrutura principal

- `app/index.tsx` → `LeadCaptureScreen` (tela principal de captura + sync).
- `app/offline-leads.tsx` → `OfflineLeadsScreen` (gestão da fila offline).
- `app/_layout.tsx` → Layout raiz com `expo-router` + `SafeAreaProvider`.
- `services/offlineStorage.ts` → Funções de salvar/buscar/limpar leads no `AsyncStorage`.
- `services/hubspotApi.ts` → Envio de leads para o HubSpot.
- `constants/Configs.ts` → `HUBSPOT_CONFIG` e `STORAGE_KEY`.
- `types/index.ts` → Tipos `LeadFormData` e `Lead`.

---

## Como rodar o projeto localmente

1. **Instalar dependências**

   ```bash
   npm install
   ```

2. **Iniciar o app (Metro bundler)**

   ```bash
   npx expo start
   ```

3. **Abrir no dispositivo/emulador**

   - Expo Go (Android/iOS) escaneando o QR Code.
   - Ou emulador Android (`a` no terminal) / web (`w`).

---

## Licença

Projeto interno do **Grupo 3C** para uso em eventos presenciais. A licença padrão do template Expo (MIT) continua válida para o código base, mas a propriedade intelectual do produto pertence ao Grupo 3C.
