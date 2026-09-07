# Project Roadmap

**7 phases** | **18 requirements mapped** | v1 complete + v2 features in progress

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Setup & Hotmart Webhooks | Receber e salvar eventos da Hotmart de forma confiável no banco de dados. | HOT-01, HOT-02, HOT-03, DB-01, DB-02, DB-03 | 3 |
| 2 | Facebook Ads & Cron | Recuperar custos de anúncios da API do FB em uma rotina periódica e salvar. | FB-01, FB-02, FB-03 | 2 |
| 3 | Core Metrics Engine | Processar eventos de vendas e gastos para calcular as métricas exatas. | CALC-01, CALC-02, CALC-03, CALC-04 | 2 |
| 4 | Dashboard UI | Exibir as informações consolidadas visualmente para o usuário com atualizações periódicas. | UI-01, UI-02, UI-03 | 2 |
| 5 | Date Range Picker Avançado | Substituir o seletor de datas simples por um calendário interativo estilo Facebook, com opções predefinidas e seleção customizada. | UI-04 | 2 |
| 6 | Importação de Histórico Hotmart | Criar um endpoint e UI para importar o histórico de vendas passadas via API REST da Hotmart, não só os eventos futuros do webhook. | HOT-04 | 2 |
| 7 | Filtro por Produto | Adicionar filtro de produto ao dashboard para visualizar métricas isoladas por produto vendido. | UI-05 | 2 |

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

### Phase 6: Importação de Histórico Hotmart
**Goal**: Criar um endpoint e UI para importar o histórico de vendas passadas via API REST da Hotmart, não só os eventos futuros do webhook.
**Requirements**: HOT-04
**Depends on**: Phase 1
**Success criteria**:
1. Botão "Importar Histórico" no dashboard dispara chamada à API Hotmart de vendas passadas.
2. O endpoint autentica via Bearer token na API REST da Hotmart e pagina os resultados.
3. As vendas são salvas no banco com UPSERT (não duplica se rodar duas vezes).
4. Uma barra de progresso ou feedback visual é exibido durante a importação.
**Plans:** 3 plans

Plans:
- [ ] 06-01-PLAN.md — Camada de mapeamento puro da API de histórico da Hotmart + harness de verificação offline
- [ ] 06-02-PLAN.md — Endpoint POST /api/sync/hotmart (Bearer, paginação, upsert idempotente) + documentação de env
- [ ] 06-03-PLAN.md — Botão "Importar Histórico" com barra de progresso no DashboardHeader

### Phase 7: Filtro por Produto
**Goal**: Adicionar filtro de produto ao dashboard para visualizar métricas isoladas por produto vendido.
**Requirements**: UI-05
**Depends on**: Phase 4, Phase 6
**Success criteria**:
1. Um dropdown "Produto" aparece ao lado do date picker no topo do dashboard.
2. Ao selecionar um produto, todos os cards (Faturamento, Lucro, ROAS, etc.) filtram somente pelas vendas daquele produto.
3. A tabela de campanhas também reflete o filtro de produto.
4. A opção "Todos os produtos" está disponível para voltar à visão global.
