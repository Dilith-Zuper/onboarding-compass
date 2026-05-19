export type MessageSegment =
  | { kind: 'text'; value: string }
  | { kind: 'token'; value: string; raw: string };

/**
 * Friendly labels for known Zuper template variables.
 * Keys are lower-cased, snake_case identifiers as they appear inside `{{…}}` tokens.
 */
const KNOWN_TOKENS: Record<string, string> = {
  customer_name:       'Customer name',
  customer_first_name: 'Customer first name',
  customer_last_name:  'Customer last name',
  customer_email:      'Customer email',
  customer_phone:      'Customer phone',
  customer_address:    'Customer address',

  job_category:        'Job type',
  job_status:          'Job status',
  job_title:           'Job title',
  job_id:              'Job ID',
  job_date:            'Job date',
  job_time:            'Job time',
  job_due_date:        'Job due date',
  job_address:         'Job address',

  technician_name:     'Technician',
  technician_phone:    'Technician phone',
  technician_email:    'Technician email',

  company_name:        'Company name',
  company_phone:       'Company phone',
  company_email:       'Office email',

  invoice_number:      'Invoice number',
  invoice_amount:      'Invoice amount',
  invoice_due_date:    'Invoice due date',

  estimate_number:     'Estimate number',
  estimate_amount:     'Estimate amount',
};

/**
 * Split a notification body (containing `{{token}}` placeholders, optional HTML tags,
 * and whitespace) into renderable segments. Tokens become small inline pills in the UI;
 * unknown tokens fall back to `[…]`.
 *
 * Pure / serializable: safe to use in both the wizard UI and react-pdf renderers.
 */
export function humanizeMessage(raw: string | null | undefined): MessageSegment[] {
  if (!raw) return [];

  const stripped = String(raw)
    .replace(/<br\s*\/?>(?!$)/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!stripped) return [];

  const segments: MessageSegment[] = [];
  const re = /\{\{\s*([\w.]+)\s*\}\}/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(stripped)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ kind: 'text', value: stripped.slice(lastIndex, m.index) });
    }
    const rawToken = m[1].toLowerCase().replace(/\./g, '_');
    const label = KNOWN_TOKENS[rawToken] ?? '…';
    segments.push({ kind: 'token', value: label, raw: m[1] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < stripped.length) {
    segments.push({ kind: 'text', value: stripped.slice(lastIndex) });
  }

  return segments;
}

/**
 * Plain-text rendering of a humanized message — used in the PDF where pill styling
 * isn't practical. Tokens render as `[Label]`.
 */
export function renderMessagePlain(raw: string | null | undefined): string {
  return humanizeMessage(raw)
    .map((seg) => (seg.kind === 'text' ? seg.value : `[${seg.value}]`))
    .join('');
}
