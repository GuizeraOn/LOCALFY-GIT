---
wave: 1
depends_on: []
files_modified:
  - "src/components/DateRangePicker.tsx"
  - "src/components/DashboardHeader.tsx"
autonomous: true
requirements_addressed:
  - UI-04
---

# Plan 01: Date Range Picker Avançado

## Objective
Substituir o `<select>` simples da barra do dashboard por um componente `DateRangePicker` completo estilo Facebook, com: calendário duplo, lista de atalhos predefinidos e seleção customizada de intervalo.

## Context & Rationale
- O seletor atual usa um `<select>` nativo com apenas 4 opções. O usuário quer algo similar ao picker do Facebook Ads Manager, com calendário visual, opções predefinidas e datas customizadas.
- Não vamos instalar nenhuma biblioteca nova — implementaremos do zero com Tailwind CSS, usando a API nativa de `Date` do JavaScript e o hook `useState`.

## Component API (interface pública)
```tsx
<DateRangePicker
  startDate="2026-08-31"
  endDate="2026-09-07"
  onChange={(start: string, end: string) => void}
/>
```

## Tasks

<task>
  <description>Criar componente DateRangePicker.tsx</description>
  <action>
    Criar `src/components/DateRangePicker.tsx`.

    **Estrutura visual (3 colunas):**
    - Coluna esquerda (sidebar): Lista de atalhos predefinidos com seleção por rádio
    - Coluna central: Calendário do mês anterior/atual (passando para o próximo)
    - Coluna direita: Calendário do mês seguinte

    **Atalhos predefinidos:**
    - Hoje
    - Ontem
    - Hoje e ontem
    - Últimos 7 dias
    - Últimos 14 dias
    - Últimos 28 dias
    - Últimos 30 dias
    - Esta semana (Seg-Dom atual)
    - Semana passada
    - Este mês
    - Mês passado
    - Máximo (desde 1 ano atrás)

    **Calendário:**
    - Exibir 2 meses lado a lado
    - Dias clicáveis: seleção de início e fim do intervalo
    - Highlight do intervalo entre start e end (cor de fundo `bg-blue-600/20`)
    - Início e fim destacados com `bg-blue-600 text-white rounded-full`
    - Botões de navegação `<` e `>` para mudar os meses exibidos

    **Comportamento de seleção customizada:**
    - Primeiro clique define `selectingStart`
    - Segundo clique define `selectingEnd` (se > start, caso contrário inverte)
    - Ao definir os dois, atualiza o preset ativo para "Personalizado"

    **Rodapé:**
    - Label "Fuso horário: Horário de Brasília"
    - Botões "Cancelar" e "Atualizar"
    - Botão "Atualizar" chama `onChange(start, end)` e fecha o popup

    **Trigger Button:**
    - Exibir "📅 DD de MMM - DD de MMM" formatado em pt-BR
    - Ao clicar, abre um dropdown/popup abaixo com o picker
    - Fechamento ao clicar fora (useEffect com event listener no `document`)
  </action>
  <acceptance_criteria>
    - `cat src/components/DateRangePicker.tsx` existe e contém os presets e o calendário
  </acceptance_criteria>
</task>

<task>
  <description>Atualizar DashboardHeader para usar DateRangePicker</description>
  <action>
    Modificar `src/components/DashboardHeader.tsx`:
    - Remover o `<select>` e a lógica de `handleRangeChange`
    - Importar e usar o componente `<DateRangePicker startDate endDate onChange />`
    - Manter o botão "Sync Facebook" inalterado
  </action>
  <read_first>
    - src/components/DashboardHeader.tsx
  </read_first>
  <acceptance_criteria>
    - DashboardHeader não contém mais o elemento `<select>` de datas
  </acceptance_criteria>
</task>

## Verification
- Abrir `http://localhost:3000`
- Clicar no botão de datas → popup com calendário duplo e lista de atalhos aparece
- Selecionar "Ontem" → datas atualizam e dashboard recarrega
- Selecionar manualmente um intervalo no calendário → highlight aparece e "Atualizar" aplica as datas
