import test from 'node:test';
import assert from 'node:assert/strict';
import { AlertManager, triggerAlert } from './alertManager';

test('triggerAlert creates well-formed alert with default remark អរគុណច្រើនមេ', () => {
  const alert = triggerAlert({
    username: 'zaion',
    amount: 5,
  });

  assert.equal(alert.username, 'zaion');
  assert.equal(alert.amount, 5);
  assert.equal(alert.message, 'អរគុណច្រើនមេ');
  assert.equal(alert.theme, 'neon');
  assert.equal(alert.formattedAmount, '$ 5.00');
});

test('AlertManager queues alerts and emits events', async () => {
  const manager = new AlertManager();
  const started: string[] = [];

  manager.on('start', (alert) => {
    started.push(alert.username);
  });

  manager.enqueue({
    id: '1',
    username: 'Donor A',
    amount: 1,
    displayDurationMs: 50,
  });

  manager.enqueue({
    id: '2',
    username: 'Donor B',
    amount: 2,
    displayDurationMs: 50,
  });

  // Give short time for first alert to start
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(started[0], 'Donor A');

  // Wait for queue to process
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(started[1], 'Donor B');
});
