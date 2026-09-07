/**
 * Offline assertion harness for src/lib/hotmart.ts
 *
 * Usage:
 *   npx tsc src/lib/hotmart.ts --outDir .tmp-verify --module es2022 --target es2022 --moduleResolution bundler
 *   node scripts/check-hotmart-mapping.mjs
 */

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

// Ensure .tmp-verify/package.json exists so Node treats emitted ESM as ESM
const tmpDir = join(repoRoot, '.tmp-verify');
if (!existsSync(tmpDir)) {
  mkdirSync(tmpDir, { recursive: true });
}
const pkgJson = join(tmpDir, 'package.json');
if (!existsSync(pkgJson)) {
  writeFileSync(pkgJson, '{"type":"module"}\n', 'utf8');
}

// Dynamic import of the compiled module
const compiledPath = join(tmpDir, 'hotmart.js');
let mod;
try {
  mod = await import(pathToFileURL(compiledPath).href);
} catch (err) {
  console.error('Failed to import compiled module:', err);
  console.error(
    'Remediation: npx tsc src/lib/hotmart.ts --outDir .tmp-verify --module es2022 --target es2022 --moduleResolution bundler',
  );
  process.exit(1);
}

const { mapHotmartItem, dedupeMappedSales, buildSalesHistoryUrl, extractPageInfo } = mod;

// ---------------------------------------------------------------------------
// 1. Epoch milliseconds
// ---------------------------------------------------------------------------
{
  const result = mapHotmartItem({
    purchase: {
      transaction: 'HP1',
      status: 'approved',
      price: { value: 199.9 },
      order_date: 1700000000000,
    },
  });
  assert.ok(result !== null, 'Test 1: result should not be null');
  assert.equal(result.sale.transaction_id, 'HP1', 'Test 1: transaction_id');
  assert.equal(result.sale.status, 'APPROVED', 'Test 1: status uppercased');
  assert.equal(result.sale.price, 199.9, 'Test 1: price');
  assert.equal(result.sale.created_at, '2023-11-14T22:13:20.000Z', 'Test 1: epoch ms date');
}

// ---------------------------------------------------------------------------
// 2. Epoch seconds
// ---------------------------------------------------------------------------
{
  const result = mapHotmartItem({
    purchase: {
      transaction: 'HP1',
      status: 'approved',
      price: { value: 199.9 },
      order_date: 1700000000,
    },
  });
  assert.ok(result !== null, 'Test 2: result should not be null');
  assert.equal(result.sale.created_at, '2023-11-14T22:13:20.000Z', 'Test 2: epoch seconds date');
}

// ---------------------------------------------------------------------------
// 3. Date fallback chain
// ---------------------------------------------------------------------------
{
  // approved_date fallback
  const r1 = mapHotmartItem({
    purchase: {
      transaction: 'HP1',
      status: 'approved',
      price: { value: 100 },
      approved_date: 1700000000000,
    },
  });
  assert.ok(r1 !== null, 'Test 3a: result not null');
  assert.equal(r1.sale.created_at, '2023-11-14T22:13:20.000Z', 'Test 3a: approved_date fallback');

  // None of the date fields — created_at should be null
  const r2 = mapHotmartItem({
    purchase: { transaction: 'HP2', status: 'approved', price: { value: 50 } },
  });
  assert.ok(r2 !== null, 'Test 3b: result not null');
  assert.equal(r2.sale.created_at, null, 'Test 3b: no date -> null');
}

// ---------------------------------------------------------------------------
// 4. Query-string UTMs
// ---------------------------------------------------------------------------
{
  const result = mapHotmartItem({
    purchase: {
      transaction: 'HP1',
      status: 'APPROVED',
      price: { value: 99 },
      tracking: {
        source_sck:
          'utm_source=facebook&utm_medium=cpc&utm_campaign=BLACK_FRIDAY&utm_content=ad1&utm_term=kw1',
      },
    },
  });
  assert.ok(result !== null, 'Test 4: result not null');
  assert.deepEqual(result.utms, {
    transaction_id: 'HP1',
    utm_source: 'facebook',
    utm_medium: 'cpc',
    utm_campaign: 'BLACK_FRIDAY',
    utm_content: 'ad1',
    utm_term: 'kw1',
  }, 'Test 4: query-string UTMs');
}

// ---------------------------------------------------------------------------
// 5. Pipe-delimited UTMs
// ---------------------------------------------------------------------------
{
  const result = mapHotmartItem({
    purchase: {
      transaction: 'HP1',
      status: 'APPROVED',
      price: { value: 99 },
      tracking: { source_sck: 'facebook|cpc|BLACK_FRIDAY' },
    },
  });
  assert.ok(result !== null, 'Test 5: result not null');
  assert.ok(result.utms !== null, 'Test 5: utms not null');
  assert.equal(result.utms.utm_source, 'facebook', 'Test 5: utm_source');
  assert.equal(result.utms.utm_medium, 'cpc', 'Test 5: utm_medium');
  assert.equal(result.utms.utm_campaign, 'BLACK_FRIDAY', 'Test 5: utm_campaign');
  assert.equal(result.utms.utm_content, null, 'Test 5: utm_content null');
  assert.equal(result.utms.utm_term, null, 'Test 5: utm_term null');
}

// ---------------------------------------------------------------------------
// 6. Bare source fallback
// ---------------------------------------------------------------------------
{
  const result = mapHotmartItem({
    purchase: {
      transaction: 'HP1',
      status: 'APPROVED',
      price: { value: 99 },
      tracking: { source: 'organico', external_code: 'ext-9' },
    },
  });
  assert.ok(result !== null, 'Test 6: result not null');
  assert.ok(result.utms !== null, 'Test 6: utms not null');
  assert.equal(result.utms.utm_source, 'organico', 'Test 6: utm_source bare');
  assert.equal(result.utms.utm_content, 'ext-9', 'Test 6: utm_content from external_code');
}

// ---------------------------------------------------------------------------
// 7. No tracking at all -> utms === null
// ---------------------------------------------------------------------------
{
  const result = mapHotmartItem({
    purchase: { transaction: 'HP1', status: 'APPROVED', price: { value: 99 } },
  });
  assert.ok(result !== null, 'Test 7: result not null');
  assert.equal(result.utms, null, 'Test 7: no tracking -> utms null');
}

// ---------------------------------------------------------------------------
// 8. Missing transaction id -> null
// ---------------------------------------------------------------------------
{
  const result = mapHotmartItem({ purchase: { status: 'APPROVED' } });
  assert.equal(result, null, 'Test 8: missing transaction id -> null');
}

// ---------------------------------------------------------------------------
// 9. Price coercion
// ---------------------------------------------------------------------------
{
  // String price
  const r1 = mapHotmartItem({
    purchase: { transaction: 'HP1', status: 'APPROVED', price: { value: '199.90' } },
  });
  assert.ok(r1 !== null, 'Test 9a: result not null');
  assert.equal(r1.sale.price, 199.9, 'Test 9a: string price coerced');

  // Missing price -> 0
  const r2 = mapHotmartItem({ purchase: { transaction: 'HP1', status: 'APPROVED' } });
  assert.ok(r2 !== null, 'Test 9b: result not null');
  assert.equal(r2.sale.price, 0, 'Test 9b: missing price -> 0');

  // Non-numeric price -> 0, never NaN
  const r3 = mapHotmartItem({
    purchase: { transaction: 'HP1', status: 'APPROVED', price: { value: 'bad' } },
  });
  assert.ok(r3 !== null, 'Test 9c: result not null');
  assert.equal(r3.sale.price, 0, 'Test 9c: non-numeric price -> 0');
  assert.equal(Number.isNaN(r3.sale.price), false, 'Test 9c: price is never NaN');
}

// ---------------------------------------------------------------------------
// 10. dedupeMappedSales
// ---------------------------------------------------------------------------
{
  const item1 = mapHotmartItem({ purchase: { transaction: 'HP1', status: 'pending', price: { value: 10 } } });
  const item2 = mapHotmartItem({ purchase: { transaction: 'HP2', status: 'APPROVED', price: { value: 20 } } });
  const item3 = mapHotmartItem({ purchase: { transaction: 'HP1', status: 'APPROVED', price: { value: 10 } } });
  assert.ok(item1 && item2 && item3, 'Test 10: items mapped');

  const deduped = dedupeMappedSales([item1, item2, item3]);
  assert.equal(deduped.length, 2, 'Test 10: length 2 after dedup');
  assert.equal(deduped[0].sale.transaction_id, 'HP1', 'Test 10: HP1 is first');
  assert.equal(deduped[1].sale.transaction_id, 'HP2', 'Test 10: HP2 is second');
  assert.equal(deduped[0].sale.status, 'APPROVED', 'Test 10: HP1 carries last status');
}

// ---------------------------------------------------------------------------
// 11. buildSalesHistoryUrl
// ---------------------------------------------------------------------------
{
  const url1 = new URL(buildSalesHistoryUrl({ startDateMs: 1700000000000, endDateMs: 1700086400000 }));
  assert.equal(url1.host, 'developers.hotmart.com', 'Test 11: correct host');
  assert.ok(url1.pathname.endsWith('/payments/api/v1/sales/history'), 'Test 11: correct pathname');
  assert.equal(url1.searchParams.get('start_date'), '1700000000000', 'Test 11: start_date');
  assert.equal(url1.searchParams.get('end_date'), '1700086400000', 'Test 11: end_date');
  assert.equal(url1.searchParams.get('max_results'), '50', 'Test 11: max_results default 50');
  assert.equal(url1.searchParams.get('page_token'), null, 'Test 11: no page_token without param');

  const url2 = new URL(
    buildSalesHistoryUrl({ startDateMs: 1700000000000, endDateMs: 1700086400000, pageToken: 'abc' }),
  );
  assert.equal(url2.searchParams.get('page_token'), 'abc', 'Test 11: page_token set');
}

// ---------------------------------------------------------------------------
// 12. extractPageInfo
// ---------------------------------------------------------------------------
{
  const r1 = extractPageInfo({ page_info: { next_page_token: 'tok', total_results: 137 } });
  assert.deepEqual(r1, { nextPageToken: 'tok', totalResults: 137 }, 'Test 12: full page_info');

  const r2 = extractPageInfo({});
  assert.deepEqual(r2, { nextPageToken: null, totalResults: null }, 'Test 12: empty payload');
}

// ---------------------------------------------------------------------------
// 13. Product extraction — top-level product object
// ---------------------------------------------------------------------------
{
  const result = mapHotmartItem({
    product: { id: 123, name: 'Curso X' },
    purchase: { transaction: 'HP-P1', status: 'approved', price: { value: 10 } },
  });
  assert.ok(result !== null, 'Test 13: result not null');
  assert.equal(result.sale.product_id, '123', 'Test 13: product_id from top-level product.id (number -> string)');
  assert.equal(result.sale.product_name, 'Curso X', 'Test 13: product_name from top-level product.name');
}

// ---------------------------------------------------------------------------
// 14. Product extraction — product nested inside purchase
// ---------------------------------------------------------------------------
{
  const result = mapHotmartItem({
    purchase: { transaction: 'HP-P2', product: { id: 'ABC', name: 'Curso Y' }, status: 'approved', price: { value: 10 } },
  });
  assert.ok(result !== null, 'Test 14: result not null');
  assert.equal(result.sale.product_id, 'ABC', 'Test 14: product_id from purchase.product.id');
  assert.equal(result.sale.product_name, 'Curso Y', 'Test 14: product_name from purchase.product.name');
}

// ---------------------------------------------------------------------------
// 15. Product extraction — fallback by ucode + trim
// ---------------------------------------------------------------------------
{
  const result = mapHotmartItem({
    product: { ucode: 'u-9', name: '  Curso Z  ' },
    purchase: { transaction: 'HP-P3' },
  });
  assert.ok(result !== null, 'Test 15: result not null');
  assert.equal(result.sale.product_id, 'u-9', 'Test 15: product_id from product.ucode');
  assert.equal(result.sale.product_name, 'Curso Z', 'Test 15: product_name trimmed');
}

// ---------------------------------------------------------------------------
// 16. Product extraction — no product -> both null, sale not null
// ---------------------------------------------------------------------------
{
  const result = mapHotmartItem({
    purchase: { transaction: 'HP-P4', status: 'approved', price: { value: 10 } },
  });
  assert.ok(result !== null, 'Test 16: result not null even without product');
  assert.equal(result.sale.product_id, null, 'Test 16: product_id null when absent');
  assert.equal(result.sale.product_name, null, 'Test 16: product_name null when absent');
}

console.log('ALL HOTMART MAPPING CHECKS PASSED');
