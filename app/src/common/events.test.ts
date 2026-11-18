import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AudioEventSequencer } from './events';

const createSequencer = () => {
  const processed: string[] = [];
  const sequencer = new AudioEventSequencer((chunks) => processed.push(...chunks));
  return { processed, sequencer };
};

test('processes events that arrive in order', () => {
  const { processed, sequencer } = createSequencer();

  sequencer.next(['a'], 0);
  sequencer.next(['b'], 1);

  assert.deepEqual(processed, ['a', 'b']);
});

test('holds an early event until the missing one arrives', () => {
  const { processed, sequencer } = createSequencer();

  sequencer.next(['a'], 0);
  sequencer.next(['c'], 2);
  assert.deepEqual(processed, ['a']);

  sequencer.next(['b'], 1);
  assert.deepEqual(processed, ['a', 'b', 'c']);
});

test('ignores an event that was already processed', () => {
  const { processed, sequencer } = createSequencer();

  sequencer.next(['a'], 0);
  sequencer.next(['again'], 0);

  assert.deepEqual(processed, ['a']);
});

test('gives up on a missing event once it is more than two behind, keeping what was queued', () => {
  const { processed, sequencer } = createSequencer();

  sequencer.next(['a'], 0);
  sequencer.next(['c'], 2);
  sequencer.next(['d'], 3);

  assert.deepEqual(processed, ['a', 'c', 'd']);
});

test('keeps waiting for a later gap after skipping an earlier one', () => {
  const { processed, sequencer } = createSequencer();

  sequencer.next(['a'], 0);
  sequencer.next(['c'], 2);
  sequencer.next(['e'], 4);
  assert.deepEqual(processed, ['a', 'c']);

  sequencer.next(['d'], 3);
  assert.deepEqual(processed, ['a', 'c', 'd', 'e']);
});
