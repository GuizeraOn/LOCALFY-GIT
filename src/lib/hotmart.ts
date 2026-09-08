export const HOTMART_SALES_HISTORY_URL =
  'https://developers.hotmart.com/payments/api/v1/sales/history';

export interface HotmartSaleRow {
  transaction_id: string;
  status: string;
  price: number;
  created_at: string | null; // ISO 8601 UTC, null when Hotmart gave no usable date
  product_id: string | null;   // null when Hotmart response has no product info
  product_name: string | null; // null when Hotmart response has no product info
}

export interface HotmartUtmRow {
  transaction_id: string;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface MappedHotmartSale {
  sale: HotmartSaleRow;
  utms: HotmartUtmRow | null; // null when every utm field is null
}

export interface PageInfo {
  nextPageToken: string | null;
  totalResults: number | null;
}

// ---------------------------------------------------------------------------
// Internal helpers — no exports, no imports
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toCleanString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function toIsoDate(value: unknown): string | null {
  let ms: number;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    if (value >= 1e12) {
      ms = value;
    } else if (value > 0) {
      ms = value * 1000;
    } else {
      return null;
    }
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const n = Number(trimmed);
    if (Number.isFinite(n)) {
      // Numeric string — apply epoch rules
      if (n >= 1e12) {
        ms = n;
      } else if (n > 0) {
        ms = n * 1000;
      } else {
        return null;
      }
    } else {
      // Non-numeric string — pass to Date.parse
      ms = Date.parse(trimmed);
    }
  } else {
    return null;
  }
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

// ---------------------------------------------------------------------------
// Exported helpers
// ---------------------------------------------------------------------------

/**
 * Parses a Hotmart tracking string into UTM fields.
 * Supports query-string format, pipe-delimited format, and bare source.
 */
export function parseUtmString(raw: unknown): Omit<HotmartUtmRow, 'transaction_id'> {
  const s = toCleanString(raw);
  if (s === null) {
    return {
      utm_source: null,
      utm_campaign: null,
      utm_medium: null,
      utm_content: null,
      utm_term: null,
    };
  }
  if (s.includes('=')) {
    const stripped = s.startsWith('?') ? s.slice(1) : s;
    const params = new URLSearchParams(stripped);
    return {
      utm_source: toCleanString(params.get('utm_source')),
      utm_campaign: toCleanString(params.get('utm_campaign')),
      utm_medium: toCleanString(params.get('utm_medium')),
      utm_content: toCleanString(params.get('utm_content')),
      utm_term: toCleanString(params.get('utm_term')),
    };
  }
  if (s.includes('|')) {
    const parts = s.split('|');
    return {
      utm_source: toCleanString(parts[0]),
      utm_medium: toCleanString(parts[1]),
      utm_campaign: toCleanString(parts[2]),
      utm_content: toCleanString(parts[3]),
      utm_term: toCleanString(parts[4]),
    };
  }
  // Bare string — utm_source only
  return {
    utm_source: s,
    utm_campaign: null,
    utm_medium: null,
    utm_content: null,
    utm_term: null,
  };
}

function extractProduct(
  record: Record<string, unknown>,
  purchase: Record<string, unknown>,
): { product_id: string | null; product_name: string | null } {
  const product = asRecord(record.product ?? purchase.product);
  const product_id =
    toCleanString(product.id) ??
    toCleanString(product.ucode) ??
    toCleanString(record.product_id) ??
    null;
  const product_name =
    toCleanString(product.name) ??
    toCleanString(record.product_name) ??
    null;
  return { product_id, product_name };
}

function extractUtms(
  purchase: Record<string, unknown>,
  transactionId: string,
): HotmartUtmRow | null {
  const tracking = asRecord(purchase.tracking ?? purchase.origin);

  // Start from source_sck; fall back to source if all null
  let parsed = parseUtmString(tracking.source_sck);
  const parsedAllNull =
    parsed.utm_source === null &&
    parsed.utm_campaign === null &&
    parsed.utm_medium === null &&
    parsed.utm_content === null &&
    parsed.utm_term === null;
  if (parsedAllNull) {
    parsed = parseUtmString(tracking.source);
  }

  // Explicit tracking keys override parsed values
  const explicitSource = toCleanString(tracking.utm_source);
  const explicitMedium = toCleanString(tracking.utm_medium);
  const explicitCampaign = toCleanString(tracking.utm_campaign);
  const explicitContent = toCleanString(tracking.utm_content);
  const explicitTerm = toCleanString(tracking.utm_term);

  let utm_source = explicitSource !== null ? explicitSource : parsed.utm_source;
  const utm_medium = explicitMedium !== null ? explicitMedium : parsed.utm_medium;
  const utm_campaign = explicitCampaign !== null ? explicitCampaign : parsed.utm_campaign;
  let utm_content = explicitContent !== null ? explicitContent : parsed.utm_content;
  const utm_term = explicitTerm !== null ? explicitTerm : parsed.utm_term;

  // Remaining fallbacks
  if (utm_source === null) {
    utm_source = toCleanString(tracking.source);
  }
  if (utm_content === null) {
    utm_content = toCleanString(tracking.external_code);
  }

  if (
    utm_source === null &&
    utm_campaign === null &&
    utm_medium === null &&
    utm_content === null &&
    utm_term === null
  ) {
    return null;
  }

  return {
    transaction_id: transactionId,
    utm_source,
    utm_campaign,
    utm_medium,
    utm_content,
    utm_term,
  };
}

/**
 * Maps a single raw Hotmart sales-history item to the DB row shapes.
 * Returns null for items with no usable transaction id.
 */
export function mapHotmartItem(item: unknown): MappedHotmartSale | null {
  const record = asRecord(item);
  const purchase = asRecord(record.purchase ?? item);

  const transactionId =
    toCleanString(purchase.transaction) ??
    toCleanString(record.transaction) ??
    toCleanString(asRecord(purchase.order).transaction) ??
    toCleanString(purchase.transaction_id);

  if (transactionId === null) return null;

  const rawStatus =
    toCleanString(purchase.status) ??
    toCleanString(record.status) ??
    toCleanString(purchase.transaction_status) ??
    'UNKNOWN';
  const status = rawStatus.toUpperCase();

  const priceRaw: unknown =
    asRecord(purchase.price).value ??
    asRecord(purchase.full_price).value ??
    purchase.price ??
    record.price;
  const priceNum = Number(priceRaw);
  const price = Number.isNaN(priceNum) ? 0 : priceNum;

  const createdAt =
    toIsoDate(purchase.order_date) ??
    toIsoDate(purchase.approved_date) ??
    toIsoDate(purchase.date) ??
    toIsoDate(purchase.purchase_date) ??
    toIsoDate(purchase.date_created) ??
    toIsoDate(purchase.recurrency_date) ??
    toIsoDate(record.order_date) ??
    toIsoDate(record.approved_date) ??
    toIsoDate(record.purchase_date) ??
    toIsoDate(record.creation_date) ??
    toIsoDate(record.date);

  if (createdAt === null) {
    // Warn so server logs reveal which fields are present for debugging
    const dateKeys = Object.keys({ ...record, purchase: undefined }).filter(k => k !== 'purchase');
    const purchaseKeys = Object.keys(purchase);
    console.warn(
      '[hotmart] date extraction failed for transaction',
      transactionId,
      '| record keys:', dateKeys,
      '| purchase keys:', purchaseKeys,
    );
  }

  const utms = extractUtms(purchase, transactionId);
  const { product_id, product_name } = extractProduct(record, purchase);

  return {
    sale: {
      transaction_id: transactionId,
      status,
      price,
      created_at: createdAt ?? null,
      product_id,
      product_name,
    },
    utms,
  };
}

/**
 * Collapses duplicate transaction ids, keeping the LAST occurrence of each,
 * while preserving the first-seen ordering.
 * Required because Postgres ON CONFLICT cannot affect the same row twice in one batch.
 */
export function dedupeMappedSales(items: MappedHotmartSale[]): MappedHotmartSale[] {
  // Build a map so last-write wins
  const lastSeen = new Map<string, MappedHotmartSale>();
  for (const item of items) {
    lastSeen.set(item.sale.transaction_id, item);
  }
  // Walk in original order, emit the last-seen entry for each first-encountered id
  const result: MappedHotmartSale[] = [];
  const emitted = new Set<string>();
  for (const item of items) {
    const id = item.sale.transaction_id;
    if (!emitted.has(id)) {
      emitted.add(id);
      // Non-null assertion is safe: we just set it in the first loop
      result.push(lastSeen.get(id)!);
    }
  }
  return result;
}

/**
 * Extracts pagination info from a Hotmart API response payload.
 */
export function extractPageInfo(payload: unknown): PageInfo {
  const record = asRecord(payload);
  const pageInfo = asRecord(record.page_info);

  const nextPageToken =
    toCleanString(pageInfo.next_page_token) ??
    toCleanString(record.next_page_token);

  const rawTotal = pageInfo.total_results ?? record.total_results;
  const totalNum = Number(rawTotal);
  const totalResults = Number.isFinite(totalNum) ? totalNum : null;

  return { nextPageToken, totalResults };
}

/**
 * Builds the Hotmart sales-history API URL with the given parameters.
 * Uses URLSearchParams to prevent query-string injection.
 */
export function buildSalesHistoryUrl(params: {
  startDateMs: number;
  endDateMs: number;
  pageToken?: string | null;
  maxResults?: number;
}): string {
  const url = new URL(HOTMART_SALES_HISTORY_URL);
  url.searchParams.set('start_date', String(params.startDateMs));
  url.searchParams.set('end_date', String(params.endDateMs));
  url.searchParams.set('max_results', String(params.maxResults ?? 50));
  if (params.pageToken && params.pageToken.length > 0) {
    url.searchParams.set('page_token', params.pageToken);
  }
  return url.toString();
}
