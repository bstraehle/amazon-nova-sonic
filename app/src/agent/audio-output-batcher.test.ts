import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AudioOutputBatcher } from './audio-output-batcher';

const pushMany = (batcher: AudioOutputBatcher, from: number, count: number) =>
  Array.from({ length: count }, (_, i) => batcher.push(String(from + i)));

test('sends the first batch of a reply after five chunks', () => {
  const batcher = new AudioOutputBatcher();

  const results = pushMany(batcher, 0, 5);

  assert.deepEqual(results.slice(0, 4), [undefined, undefined, undefined, undefined]);
  assert.deepEqual(results[4], ['0', '1', '2', '3', '4']);
});

test('sends later batches once more than ten chunks are queued', () => {
  const batcher = new AudioOutputBatcher();
  pushMany(batcher, 0, 5);

  const results = pushMany(batcher, 5, 11);

  assert.ok(results.slice(0, 10).every((batch) => batch === undefined));
  assert.deepEqual(results[10], ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15']);
});

test('flush returns what is left and makes the next batch a first batch again', () => {
  const batcher = new AudioOutputBatcher();
  pushMany(batcher, 0, 7);

  assert.deepEqual(batcher.flush(), ['5', '6']);
  assert.deepEqual(batcher.flush(), []);
  assert.deepEqual(pushMany(batcher, 7, 5)[4], ['7', '8', '9', '10', '11']);
});

test('drops empty chunks', () => {
  const batcher = new AudioOutputBatcher();
  batcher.push('');

  assert.deepEqual(pushMany(batcher, 0, 4)[3], ['0', '1', '2', '3']);
});
