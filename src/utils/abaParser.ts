/**
 * ABA PayWay & Telegram Donation Message Parser
 * Parses transaction notifications from ABA PayWay bot and formats them for OBS overlay & Khmer TTS.
 */

export interface ParsedDonation {
  id: string;
  donorName: string;
  amount: number;
  formattedAmount: string;
  currency: 'USD' | 'KHR';
  remark?: string;
  trxId?: string;
  apv?: string;
  dateStr?: string;
  rawText: string;
  timestamp: number;
  ttsScript: string;
}

/**
 * Clean up donor names (remove masked account numbers like (*280) or trailing punctuation)
 */
export function cleanDonorName(rawName: string): string {
  if (!rawName) return 'មិត្តអ្នកគាំទ្រ'; // default fallback "Supporter/Friend"
  const cleaned = rawName
    .replace(/\(\*?\d+\)/g, '') // remove (*280) or (123)
    .replace(/[*#]/g, '')
    .trim();

  return cleaned || 'មិត្តអ្នកគាំទ្រ';
}

export const DEFAULT_REMARK = 'អរគុណច្រើនមេ';

/**
 * Generate Khmer TTS speech script according to the exact user format:
 * "អរគុណ មេ [donorName] បានឧបត្ថម្ភ [amount]$ [remark in Khmer accent]"
 * If no remark is provided, defaults to "អរគុណច្រើនមេ"
 */
export function buildKhmerTtsScript(
  donorName: string,
  amount: number,
  currency: 'USD' | 'KHR',
  remark?: string,
  thankPrefix: string = 'អរគុណ មេ',
  verb: string = 'បានឧបត្ថម្ភ'
): string {
  const amountStr = currency === 'KHR' 
    ? `${amount.toLocaleString()} រៀល` 
    : `${amount} ដុល្លារ`;
    
  const finalRemark = (remark && remark.trim().length > 0) ? remark.trim() : DEFAULT_REMARK;
  return `${thankPrefix} ${donorName} ${verb} ${amountStr} ${finalRemark}`.trim();
}

/**
 * Parse an incoming message from ABA PayWay bot or Telegram
 */
export function parseAbaMessage(
  text: string,
  options?: { thankPrefix?: string; verb?: string }
): ParsedDonation | null {
  if (!text || typeof text !== 'string') return null;

  const raw = text.trim();
  if (raw.length === 0) return null;

  let amount = 0;
  let currency: 'USD' | 'KHR' = 'USD';
  let formattedAmount = '$1.00';
  let donorName = '';
  let remark = '';
  let trxId = '';
  let apv = '';
  let dateStr = '';

  // Extract Trx. ID if present: "Trx. ID: 179308280412746"
  const trxMatch = raw.match(/Trx\.?\s*ID:?\s*([A-Za-z0-9_-]+)/i);
  if (trxMatch) {
    trxId = trxMatch[1].trim();
  }

  // Extract APV if present: "APV: 809453"
  const apvMatch = raw.match(/APV:?\s*([A-Za-z0-9_-]+)/i);
  if (apvMatch) {
    apv = apvMatch[1].trim();
  }

  // Extract Remark / Note / Message:
  // e.g. "Remark: This is a test message" or "Description: ..." or "Note: ..."
  const remarkMatch = raw.match(/(?:Remark|Description|Note|Msg|សារ|ំណត់សម្គាល់):?\s*([^\n\r]+)/i);
  if (remarkMatch) {
    remark = remarkMatch[1].trim();
  }

  // Pattern 1: Standard ABA PayWay Bot English format
  // "$0.50 paid by HUN CHHING CHHING (*280) on Oct 27, 01:33 PM via ABA PAY at HUN CHHING CHHING."
  // or "10,000.00 KHR paid by..."
  const abaPattern1 = /([\$\£\€]?\s*[\d,]+(?:\.\d{1,2})?\s*(?:USD|KHR|៛)?)\s+paid\s+by\s+([^()]+?)(?:\s*\(\*?\d+\))?\s+on\s+([^.]+?)\s+via/i;
  const match1 = raw.match(abaPattern1);

  if (match1) {
    const rawAmt = match1[1].trim();
    donorName = cleanDonorName(match1[2]);
    dateStr = match1[3].trim();

    if (/KHR|៛/i.test(rawAmt)) {
      currency = 'KHR';
      const numOnly = rawAmt.replace(/[^0-9.]/g, '');
      amount = parseFloat(numOnly) || 0;
      formattedAmount = `${amount.toLocaleString()} ៛`;
    } else {
      currency = 'USD';
      const numOnly = rawAmt.replace(/[^0-9.]/g, '');
      amount = parseFloat(numOnly) || 0;
      formattedAmount = `$ ${amount.toFixed(2)}`;
    }
  } else {
    // Pattern 2: Flexible parser for amount and donor
    // Checks for "$1.00 paid by Name" or "Name paid $1.00" or "Name បានឧបត្ថម្ភ $1.00"
    const usdMatch = raw.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/) || raw.match(/([\d,]+(?:\.\d{1,2})?)\s*\$/);
    const khrMatch = raw.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:KHR|៛)/i);

    if (usdMatch) {
      currency = 'USD';
      amount = parseFloat(usdMatch[1].replace(/,/g, '')) || 0;
      formattedAmount = `$ ${amount.toFixed(2)}`;
    } else if (khrMatch) {
      currency = 'KHR';
      amount = parseFloat(khrMatch[1].replace(/,/g, '')) || 0;
      formattedAmount = `${amount.toLocaleString()} ៛`;
    } else {
      // Look for any general amount number if preceded or followed by donate keywords
      const genericAmt = raw.match(/(?:paid|donate|donated|ឧបត្ថម្ភ)\s+([\d.]+)/i);
      if (genericAmt) {
        amount = parseFloat(genericAmt[1]) || 0;
        formattedAmount = `$ ${amount.toFixed(2)}`;
      }
    }

    // Try to find donor name
    const paidByMatch = raw.match(/paid\s+by\s+([^,.\n]+)/i);
    const khmerPaidMatch = raw.match(/(?:បានបង់ដោយ|ឧបត្ថម្ភដោយ|ពី)\s+([^,.\n]+)/i);
    const donorPrefixMatch = raw.match(/^([A-Za-z0-9_\s\u1780-\u17FF]+?)\s+(?:paid|donated|sent|បានឧបត្ថម្ភ)/i);

    if (paidByMatch) {
      donorName = cleanDonorName(paidByMatch[1]);
    } else if (khmerPaidMatch) {
      donorName = cleanDonorName(khmerPaidMatch[1]);
    } else if (donorPrefixMatch) {
      donorName = cleanDonorName(donorPrefixMatch[1]);
    } else {
      donorName = 'មិត្តអ្នកគាំទ្រ';
    }
  }

  // If no remark was matched via prefix, check if there's a second line or text after a colon/dash
  if (!remark) {
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      // Check if second line is not Trx ID or APV
      const secondLine = lines[1];
      if (!/Trx\.?\s*ID|APV:|via ABA/i.test(secondLine)) {
        remark = secondLine;
      }
    }
  }

  // If amount is 0 and no donor found, this message isn't a donation notification
  if (amount <= 0 && (!match1 && !raw.includes('ABA PAY'))) {
    return null;
  }

  const id = trxId || `don_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const effectiveRemark = (remark && remark.trim().length > 0) ? remark.trim() : DEFAULT_REMARK;
  const ttsScript = buildKhmerTtsScript(
    donorName,
    amount,
    currency,
    effectiveRemark,
    options?.thankPrefix,
    options?.verb
  );

  return {
    id,
    donorName,
    amount,
    formattedAmount,
    currency,
    remark: effectiveRemark,
    trxId: trxId || undefined,
    apv: apv || undefined,
    dateStr: dateStr || undefined,
    rawText: raw,
    timestamp: Date.now(),
    ttsScript,
  };
}
