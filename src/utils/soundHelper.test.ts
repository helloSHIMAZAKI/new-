import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSoundSource, BUILTIN_SOUND_PRESETS } from './soundHelper';

test('BUILTIN_SOUND_PRESETS includes all core alert options', () => {
  const ids = BUILTIN_SOUND_PRESETS.map(p => p.id);
  assert.ok(ids.includes('chime'));
  assert.ok(ids.includes('cash_register'));
  assert.ok(ids.includes('coin'));
  assert.ok(ids.includes('level_up'));
  assert.ok(ids.includes('ping'));
  assert.ok(ids.includes('marimba'));
});

test('resolveSoundSource defaults to chime preset when empty', () => {
  const resolved = resolveSoundSource({});
  assert.equal(resolved.type, 'preset');
  assert.equal(resolved.preset, 'chime');
  assert.equal(resolved.volume, 0.8);
});

test('resolveSoundSource accepts valid custom audio URL', () => {
  const resolved = resolveSoundSource({
    soundType: 'custom',
    customSoundUrl: 'https://cdn.example.com/alerts/ding.mp3',
    soundVolume: 0.9,
  });
  assert.equal(resolved.type, 'custom');
  assert.equal(resolved.url, 'https://cdn.example.com/alerts/ding.mp3');
  assert.equal(resolved.volume, 0.9);
});

test('resolveSoundSource falls back to preset when custom URL is empty or invalid', () => {
  const resolved = resolveSoundSource({
    soundType: 'custom',
    customSoundUrl: '   ',
    soundPreset: 'coin',
  });
  assert.equal(resolved.type, 'preset');
  assert.equal(resolved.preset, 'coin');
});

test('resolveSoundSource clamps volume between 0 and 1', () => {
  const resolvedLow = resolveSoundSource({ soundVolume: -0.5 });
  assert.equal(resolvedLow.volume, 0);

  const resolvedHigh = resolveSoundSource({ soundVolume: 2.5 });
  assert.equal(resolvedHigh.volume, 1);
});
