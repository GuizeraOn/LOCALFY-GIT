# Phase 4: UI Design Contract (Dashboard UI)

**Date:** 2026-09-07
**Status:** Approved

## 1. Visual Language
- **Design System:** Tailwind CSS + shadcn/ui.
- **Theme:** Somente Dark Mode (forçado no `next-themes` ou classes Tailwind). Ideal para dashboards de tráfego/ads, estilo tech moderno.
- **Color Palette (Dark Mode):** 
  - Background: `bg-zinc-950`
  - Cards: `bg-zinc-900`
  - Primary (Brand): Azul vibrante (ex: `bg-blue-600`) ou Verde (lucro positivo).
  - Text: `text-zinc-100` para títulos, `text-zinc-400` para suporte.
- **Typography:** Inter (padrão Next.js app directory) ou geist-sans.
- **Spacing:** Escala base 4px do Tailwind. Layout centralizado com grid para métricas e tabela.

## 2. Interaction Design
- **State Management:** SWR para data fetching (conforme requisitos de UI-03), permitindo refresh rápido/silencioso dos dados do endpoint de métricas.
- **Navigation:** Única página (Single Page Application feel), com Date Picker no topo.
- **Loading States:** Skeleton loaders nos cards de métricas e no gráfico enquanto a API (`/api/metrics`) é consumida.

## 3. Key Components
- **Top Bar:** 
  - Título "Métricas & Vendas"
  - Filtro de Data (DateRangePicker do shadcn/ui).
  - Botão de "Sync / Atualizar Facebook" que dispara a atualização.
- **Metric Cards (Row 1):**
  - Faturamento Bruto, Faturamento Líquido, Lucro, ROAS, ROI, CPA.
  - Usar ícones do `lucide-react`.
  - Exibir variação (ex: "+15% vs último período") se possível, senão focar no valor nominal.
- **Charts (Row 2):**
  - Componente: **Recharts**
  - Gráfico de linha temporal (Faturamento vs Gastos) se a API permitir granularidade, ou um gráfico de barras.
- **Campaign Table (Row 3):**
  - Data Table com shadcn/ui.
  - Colunas: Campanha, Gastos, Vendas (Qtd), Receita, Lucro, ROAS, CPA, ROI.
  - Ordenação por padrão: Lucro ou ROAS decrescente.

## 4. Copywriting & Content
- Tom direto, financeiro.
- Formatadores de moeda (BRL `pt-BR`) sempre presentes.
- "Gastos", "Receita", "Lucro Líquido", "ROAS", "ROI".

## 5. Responsive Behavior
- **Mobile:** Cards empilham em 1 coluna (`grid-cols-1`). Gráficos recebem `aspect-video`. Tabela vira scroll horizontal (`overflow-x-auto`).
- **Desktop:** Cards em 3 ou 6 colunas (`grid-cols-3` ou `grid-cols-6`). Tabela e gráficos ocupam colunas inteiras (`col-span-full`).

## 6. Edge Cases & Error Handling
- **Empty State:** Se não houver dados no período, mostrar um empty state placeholder na tabela e gráfico.
- **API Error:** Mostrar toast (shadcn/ui toast) vermelho se a sincronização com o Facebook falhar.
