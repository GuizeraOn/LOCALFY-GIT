# Project Roadmap

**5 phases** | **16 requirements mapped** | All v1 requirements covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Setup & Hotmart Webhooks | Receber e salvar eventos da Hotmart de forma confiável no banco de dados. | HOT-01, HOT-02, HOT-03, DB-01, DB-02, DB-03 | 3 |
| 2 | Facebook Ads & Cron | Recuperar custos de anúncios da API do FB em uma rotina periódica e salvar. | FB-01, FB-02, FB-03 | 2 |
| 3 | Core Metrics Engine | Processar eventos de vendas e gastos para calcular as métricas exatas. | CALC-01, CALC-02, CALC-03, CALC-04 | 2 |
| 4 | Dashboard UI | Exibir as informações consolidadas visualmente para o usuário com atualizações periódicas. | UI-01, UI-02, UI-03 | 2 |
| 5 | Date Range Picker Avançado | Substituir o seletor de datas simples por um calendário interativo estilo Facebook, com opções predefinidas e seleção customizada. | UI-04 | 2 |

## Phase Details

### Phase 1: Setup & Hotmart Webhooks
**Goal**: Receber e salvar eventos da Hotmart de forma confiável no banco de dados.
**Requirements**: HOT-01, HOT-02, HOT-03, DB-01, DB-02, DB-03
**Success criteria**:
1. Banco de dados inicializado no Supabase.
2. Endpoint `/webhook/hotmart` disponível.
3. Evento simulado da Hotmart é gravado no banco com seus respectivos UTMs e status extraídos.

### Phase 2: Facebook Ads & Cron
**Goal**: Recuperar custos de anúncios da API do FB em uma rotina periódica e salvar.
**Requirements**: FB-01, FB-02, FB-03
**Success criteria**:
1. Script de Cron consegue se autenticar com sucesso via Graph API (ou stub, se pendente do token).
2. Gastos por campanha são lidos e gravados no banco atrelados a uma data.

### Phase 3: Core Metrics Engine
**Goal**: Processar eventos de vendas e gastos para calcular as métricas exatas.
**Requirements**: CALC-01, CALC-02, CALC-03, CALC-04
**Success criteria**:
1. Consultas para Faturamento (Bruto/Líquido), Lucro e ROAS/ROI retornam valores matematicamente corretos dado um conjunto fixo de vendas e gastos.
2. Os dados de UTM são correlacionados com o custo das campanhas, se possível, para retorno mais detalhado.

### Phase 4: Dashboard UI
**Goal**: Exibir as informações consolidadas visualmente para o usuário com atualizações periódicas.
**Requirements**: UI-01, UI-02, UI-03
**UI hint**: yes
**Success criteria**:
1. Dashboard Next.js carrega as métricas da API de cálculos (Phase 3).
2. Gráfico e Cards são exibidos de forma responsiva.

### Phase 5: Date Range Picker Avançado
**Goal**: Substituir o seletor de datas simples por um calendário interativo estilo Facebook, com opções predefinidas e seleção customizada.
**Requirements**: UI-04
**UI hint**: yes
**Depends on**: Phase 4
**Success criteria**:
1. O picker exibe um calendário duplo (dois meses lado a lado) para seleção de intervalo de datas.
2. O componente possui atalhos predefinidos (Hoje, Ontem, Últimos 7 dias, Últimos 14 dias, Últimos 28 dias, Últimos 30 dias, Esta semana, Semana passada, Este mês, Mês passado, Máximo).
3. É possível selecionar um intervalo customizado clicando em duas datas no calendário.
4. A seleção atualiza automaticamente o dashboard com os novos dados.
