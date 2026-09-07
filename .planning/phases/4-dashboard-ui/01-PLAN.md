---
wave: 1
depends_on: []
files_modified:
  - "components.json"
  - "tailwind.config.ts"
  - "src/app/layout.tsx"
  - "src/app/page.tsx"
  - "src/components/ui/date-range-picker.tsx"
autonomous: true
requirements_addressed: []
---

# Plan 01: UI Setup & Layout Base

## Objective
Configurar o ambiente frontend (shadcn/ui, Recharts, SWR, lucide-react) e criar o layout principal do Dashboard (Dark Mode) com a barra superior (Date Picker e Botão Sync).

## Context & Rationale
- **UI-SPEC**: O design contract especifica Tailwind + shadcn/ui no modo Dark, com Recharts para os gráficos.
- Precisamos da base antes de construir os componentes de dados.

## Tasks

<task>
  <description>Instalar dependências base do frontend</description>
  <action>
    Executar os seguintes comandos no terminal para instalar as bibliotecas necessárias:
    1. `npm install lucide-react recharts swr date-fns next-themes`
    2. `npx shadcn@latest init -d` (com estilo new-york, cor zinc)
    3. `npx shadcn@latest add button card table popover calendar`
  </action>
  <acceptance_criteria>
    - `package.json` possui `recharts`, `swr`, `lucide-react`.
    - Pasta `src/components/ui` foi criada com os componentes do shadcn.
  </acceptance_criteria>
</task>

<task>
  <description>Configurar Tema Dark e Layout Global</description>
  <action>
    1. Modificar `src/app/layout.tsx`:
       - Adicionar a tag `<html className="dark">` para forçar o Dark Mode conforme o UI-SPEC.
       - Garantir que o body tem `bg-zinc-950 text-zinc-100`.
    2. Ajustar `tailwind.config.ts` (ou CSS global) se necessário para garantir o fundo padrão.
  </action>
  <read_first>
    - src/app/layout.tsx
  </read_first>
  <acceptance_criteria>
    - `grep -q "dark" src/app/layout.tsx` tem saída 0.
  </acceptance_criteria>
</task>

<task>
  <description>Criar o Top Bar com DatePicker e Botão Sync</description>
  <action>
    1. Criar componente `src/components/DashboardHeader.tsx`.
    2. Implementar um título "Métricas & Vendas".
    3. Criar estado global ou passar via props as datas `startDate` e `endDate` (pode ser com useState no Client Component pai).
    4. Adicionar um botão de "Sincronizar Facebook" que faz um POST para `/api/sync/facebook` com as datas e exibe um status de carregamento.
  </action>
  <acceptance_criteria>
    - `src/components/DashboardHeader.tsx` existe e faz requisição para `/api/sync/facebook`.
  </acceptance_criteria>
</task>

## Verification
- Rodar `npm run dev` e acessar a raiz do projeto.
- O header deve estar visível no tema escuro.
- O botão de sync deve conseguir chamar a API com as datas do picker.
