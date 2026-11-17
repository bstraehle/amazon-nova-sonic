import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';

const SAMPLE_RATE = 24000;
const QUANTUM = 128;
const TOLERANCE = (2 * QUANTUM) / SAMPLE_RATE;
const source = readFileSync(join(process.cwd(), 'public', 'AudioPlayerProcessor.worklet.js'), 'utf8');

const createPlayer = () => {
  let Processor: any;
  vm.runInNewContext(source, {
    AudioWorkletProcessor: class {
      port: { onmessage: ((event: unknown) => void) | null } = { onmessage: null };
    },
    registerProcessor: (_name: string, processor: unknown) => {
      Processor = processor;
    },
  });
  const processor = new Processor();
  const output = new Float32Array(QUANTUM);
  const send = (data: unknown) => processor.port.onmessage({ data });

  return {
    send,
    write: (seconds: number) =>
      send({ type: 'audio', audioData: new Float32Array(Math.round(seconds * SAMPLE_RATE)).fill(1) }),
    run: (seconds: number) => {
      let played = 0;
      for (let i = 0; i < Math.round((seconds * SAMPLE_RATE) / QUANTUM); i++) {
        processor.process([], [[output]], {});
        played += output.reduce((sum, sample) => sum + sample, 0);
      }
      return played / SAMPLE_RATE;
    },
  };
};

const assertNear = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) <= TOLERANCE, `expected about ${expected}s of audio, got ${actual}s`);

test('waits for 0.3 seconds of audio before playing', () => {
  const player = createPlayer();

  player.write(0.2);
  assert.equal(player.run(0.05), 0);

  player.write(0.15);
  assertNear(player.run(0.1), 0.1);
});

test('plays a reply shorter than the cushion once no more audio arrives', () => {
  const player = createPlayer();

  player.write(0.1);
  assert.equal(player.run(0.15), 0);
  assertNear(player.run(0.3), 0.1);
});

test('doubles the cushion when audio resumes right after running dry', () => {
  const player = createPlayer();
  player.write(0.4);
  assertNear(player.run(0.5), 0.4);

  player.write(0.4);
  assert.equal(player.run(0.1), 0);

  player.write(0.3);
  assertNear(player.run(0.1), 0.1);
});

test('keeps the cushion when a reply ends and the next one starts later', () => {
  const player = createPlayer();
  player.write(0.4);
  assertNear(player.run(1.5), 0.4);

  player.write(0.4);
  assertNear(player.run(0.1), 0.1);
});

test('never grows the cushion beyond one second', () => {
  const player = createPlayer();
  for (let i = 0; i < 4; i++) {
    player.write(1);
    assertNear(player.run(1.2), 1);
  }

  player.write(1);
  assertNear(player.run(0.1), 0.1);
});

test('barge-in drops queued audio without growing the cushion', () => {
  const player = createPlayer();
  player.write(1);
  assertNear(player.run(0.2), 0.2);

  player.send({ type: 'barge-in' });
  assert.equal(player.run(0.05), 0);

  player.write(0.4);
  assertNear(player.run(0.1), 0.1);
});

test('the initial buffer length can still be overridden', () => {
  const player = createPlayer();
  player.send({ type: 'initial-buffer-length', bufferLength: 0 });

  player.write(0.01);
  assertNear(player.run(0.02), 0.01);
});
