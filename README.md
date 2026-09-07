This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Importação de histórico da Hotmart

O endpoint `POST /api/sync/hotmart` importa o histórico de vendas da Hotmart para o banco de dados,
permitindo que o dashboard exiba receita e ROAS de vendas que aconteceram antes da instalação do
webhook.

### Configuração

1. Acesse **Hotmart → Ferramentas → Credenciais de API** e copie o **Access Token** (Personal Access Token).
2. Cole o valor em `.env.local` (nunca commite este arquivo):
   ```
   HOTMART_ACCESS_TOKEN=seu-token-aqui
   ```

### Uso

**Requisição** (`POST /api/sync/hotmart`, `Content-Type: application/json`):

| Campo       | Tipo   | Padrão                 | Descrição                                        |
|-------------|--------|------------------------|--------------------------------------------------|
| `startDate` | string | hoje menos 365 dias    | Data de início no formato `yyyy-MM-dd`           |
| `endDate`   | string | hoje                   | Data de fim no formato `yyyy-MM-dd`              |
| `pageToken` | string | ausente (primeira pág) | Cursor opaco retornado pela chamada anterior     |

**Resposta** (HTTP 200):

| Campo          | Tipo            | Descrição                                              |
|----------------|-----------------|--------------------------------------------------------|
| `success`      | boolean         | `true`                                                 |
| `count`        | number          | Linhas inseridas/atualizadas na tabela `sales`         |
| `total`        | number          | Itens retornados pela Hotmart nesta página             |
| `skipped`      | number          | Itens descartados por não terem `transaction_id`       |
| `nextPageToken`| string \| null  | Cursor para a próxima página; `null` indica fim        |
| `totalResults` | number \| null  | Total de resultados em todas as páginas (quando disponível) |

### Paginação

Cada chamada processa exatamente **uma página** de até 50 itens. Para importar todo o histórico,
repita a chamada com o `nextPageToken` retornado até receber `null`:

```bash
# Primeira página
curl -s -X POST http://localhost:3000/api/sync/hotmart \
  -H 'Content-Type: application/json' \
  -d '{"startDate":"2024-01-01","endDate":"2024-12-31"}' | tee /tmp/page1.json

# Próxima página (use o nextPageToken da resposta anterior)
TOKEN=$(jq -r .nextPageToken /tmp/page1.json)
curl -s -X POST http://localhost:3000/api/sync/hotmart \
  -H 'Content-Type: application/json' \
  -d "{\"startDate\":\"2024-01-01\",\"endDate\":\"2024-12-31\",\"pageToken\":\"$TOKEN\"}"
```

### Idempotência

A importação é **idempotente**: cada venda é inserida com `UPSERT` na coluna `transaction_id`.
Executar a mesma importação duas vezes atualiza os registros existentes em vez de duplicá-los.
As datas históricas das vendas são preservadas em `created_at`, garantindo que o dashboard
apresente os dados no período correto.
