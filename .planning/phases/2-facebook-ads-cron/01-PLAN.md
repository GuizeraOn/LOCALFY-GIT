---
wave: 1
depends_on: []
files_modified:
  - "supabase/migrations/0001_ad_spend_unique.sql"
  - "src/app/api/sync/facebook/route.ts"
autonomous: true
requirements_addressed:
  - FB-01
  - FB-02
  - FB-03
---

# Plan 01: Facebook API Sync Endpoint

## Objective
Criar a rota Next.js para sincronizar gastos do Facebook Ads sob demanda, adicionando a constraint única no banco de dados para garantir a idempotência do UPSERT.

## Context & Rationale
- **FB-01, FB-02, FB-03**: Precisamos nos comunicar com a Graph API do Facebook usando um token de sistema e salvar os insights das campanhas.
- **D-01, D-02**: Ao invés de um cron job, a API será chamada sob demanda pelo frontend passando `startDate` e `endDate`.
- **D-03, D-04**: Devemos persistir na tabela `ad_spend` de forma idempotente, necessitando uma constraint UNIQUE em `(date, campaign_id)`.

## Tasks

<task>
  <description>Criar constraint única na tabela ad_spend</description>
  <action>
    Criar uma nova migration do Supabase (`supabase/migrations/0001_ad_spend_unique.sql`) que altera a tabela `ad_spend` adicionando uma constraint UNIQUE composta.
    Script SQL: `ALTER TABLE public.ad_spend ADD CONSTRAINT ad_spend_date_campaign_id_key UNIQUE (date, campaign_id);`
  </action>
  <read_first>
    - supabase/migrations/0000_initial_schema.sql
  </read_first>
  <acceptance_criteria>
    - `cat supabase/migrations/0001_ad_spend_unique.sql` contém `ADD CONSTRAINT`
    - `grep -q UNIQUE supabase/migrations/0001_ad_spend_unique.sql` tem saída 0
  </acceptance_criteria>
</task>

<task>
  <description>[BLOCKING] Aplicar o schema no banco de dados local do Supabase</description>
  <action>
    Executar o push do schema no ambiente local, caso suportado. Se o ambiente não possuir Docker, ignore e marque a task como concluída (pois as migrations rodarão na nuvem).
  </action>
  <read_first>
    - supabase/migrations/0001_ad_spend_unique.sql
  </read_first>
  <acceptance_criteria>
    - Se o Docker estiver indisponível, a task pode ser considerada completada apenas pela criação do arquivo SQL.
  </acceptance_criteria>
</task>

<task>
  <description>Criar endpoint de sync do Facebook</description>
  <action>
    Criar o arquivo `src/app/api/sync/facebook/route.ts` exportando uma função `POST` (ou `GET`) que:
    1. Receba `startDate` e `endDate` (do request body ou query param).
    2. Valide as variáveis de ambiente: `FB_ACCESS_TOKEN` e `FB_AD_ACCOUNT_ID`.
    3. Faça um fetch para a Graph API: `https://graph.facebook.com/v19.0/act_${FB_AD_ACCOUNT_ID}/insights?time_range={'since':'${startDate}','until':'${endDate}'}&level=campaign&fields=campaign_id,campaign_name,spend,impressions,clicks&time_increment=1&access_token=${FB_ACCESS_TOKEN}`
    4. Mapeie a resposta do Facebook (`data` array) iterando sobre cada item.
    5. Para cada item, chame o `supabaseServerClient.from('ad_spend').upsert(...)`, mapeando:
       - `date`: `item.date_start`
       - `campaign_id`: `item.campaign_id`
       - `campaign_name`: `item.campaign_name`
       - `spend`: `item.spend`
       - `impressions`: `item.impressions`
       - `clicks`: `item.clicks`
       com `onConflict: 'date, campaign_id'`.
    6. Retorne `{ success: true, count: N }` com status 200.
  </action>
  <read_first>
    - src/lib/supabase-server.ts
  </read_first>
  <acceptance_criteria>
    - `cat src/app/api/sync/facebook/route.ts` contém `graph.facebook.com`
    - `grep -q upsert src/app/api/sync/facebook/route.ts` tem saída 0
  </acceptance_criteria>
</task>

## Verification

**must_haves:**
- A rota deve interagir corretamente com a Graph API.
- A rota deve realizar o upsert na tabela usando a constraint criada.

**verification_steps:**
- Enviar uma requisição mock para a rota no frontend ou via CURL.
- Garantir que o endpoint retorne 200 sem quebrar ao salvar na base de dados.
