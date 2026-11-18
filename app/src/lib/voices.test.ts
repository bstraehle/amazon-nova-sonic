import assert from 'node:assert/strict';
import { test } from 'node:test';
import { usEnglishVoices, voiceConfigurations, voices } from './voices';

test('the picker offers only the US English voices', () => {
  assert.deepEqual(
    usEnglishVoices.map((voice) => voice.id),
    ['tiffany', 'matthew']
  );
});

test('every voice can be looked up by its id', () => {
  for (const voice of voices) {
    assert.equal(voiceConfigurations[voice.id], voice);
  }
});
