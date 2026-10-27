import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAbaMessage, buildKhmerTtsScript, cleanDonorName } from './abaParser';

test('cleanDonorName strips masked accounts and asterisks', () => {
  assert.equal(cleanDonorName('HUN CHHING CHHING (*280)'), 'HUN CHHING CHHING');
  assert.equal(cleanDonorName('zaion (*123)'), 'zaion');
  assert.equal(cleanDonorName('*VIP* Sokha'), 'VIP Sokha');
  assert.equal(cleanDonorName(''), 'មិត្តអ្នកគាំទ្រ');
});

test('parseAbaMessage parses exact Telegram notification from Image 1 ($0.50) with default remark', () => {
  const rawMsg = '$0.50 paid by HUN CHHING CHHING (*280) on Oct 27, 01:33 PM via ABA PAY at HUN CHHING CHHING. Trx. ID: 179308280412746, APV: 809453.';
  const result = parseAbaMessage(rawMsg);

  assert.ok(result !== null);
  assert.equal(result.amount, 0.50);
  assert.equal(result.currency, 'USD');
  assert.equal(result.donorName, 'HUN CHHING CHHING');
  assert.equal(result.trxId, '179308280412746');
  assert.equal(result.apv, '809453');
  assert.equal(result.formattedAmount, '$ 0.50');
  assert.equal(result.remark, 'អរគុណច្រើនមេ');
  assert.equal(result.ttsScript, 'អរគុណ មេ HUN CHHING CHHING បានឧបត្ថម្ភ 0.5 ដុល្លារ អរគុណច្រើនមេ');
});

test('parseAbaMessage parses notification with custom Remark (Image 3 scenario)', () => {
  const rawMsg = `$1.00 paid by zaion (*111) on Oct 27, 01:41 PM via ABA PAY at Streamer. Trx. ID: 179308331516889, APV: 718415.
Remark: Special donation for you!`;
  const result = parseAbaMessage(rawMsg);

  assert.ok(result !== null);
  assert.equal(result.amount, 1.00);
  assert.equal(result.currency, 'USD');
  assert.equal(result.donorName, 'zaion');
  assert.equal(result.remark, 'Special donation for you!');
  assert.equal(result.ttsScript, 'អរគុណ មេ zaion បានឧបត្ថម្ភ 1 ដុល្លារ Special donation for you!');
});

test('buildKhmerTtsScript builds the exact Khmer speech format requested with custom remark', () => {
  const script = buildKhmerTtsScript('zaion', 1, 'USD', 'Good luck with streaming!');
  assert.equal(script, 'អរគុណ មេ zaion បានឧបត្ថម្ភ 1 ដុល្លារ Good luck with streaming!');
});

test('buildKhmerTtsScript defaults to អរគុណច្រើនមេ when remark is empty', () => {
  const script = buildKhmerTtsScript('zaion', 1, 'USD', '');
  assert.equal(script, 'អរគុណ មេ zaion បានឧបត្ថម្ភ 1 ដុល្លារ អរគុណច្រើនមេ');
});

test('parseAbaMessage returns null for non-payment messages', () => {
  const chatMsg = 'Hello everyone in the group';
  assert.equal(parseAbaMessage(chatMsg), null);
});
