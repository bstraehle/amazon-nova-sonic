import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EmptyMcpConfig, mcpConfigSchema, SpeechToSpeechEventSchema } from './schemas';

test('accepts the events exchanged between the browser and the agent', () => {
  const events = [
    { direction: 'btoc', event: 'ready', data: {} },
    { direction: 'btoc', event: 'audioOutput', data: { blobs: ['AAAA'], sequence: 0 } },
    { direction: 'btoc', event: 'textOutput', data: { id: '1', role: 'assistant', content: 'Hello' } },
    { direction: 'btoc', event: 'end', data: {} },
    { direction: 'ctob', event: 'audioInput', data: { blobs: ['AAAA'], sequence: 3 } },
    { direction: 'ctob', event: 'terminateSession', data: {} },
  ];

  for (const event of events) {
    assert.ok(SpeechToSpeechEventSchema.safeParse(event).success, JSON.stringify(event));
  }
});

test('rejects unknown events and malformed audio', () => {
  assert.equal(SpeechToSpeechEventSchema.safeParse({ direction: 'btoc', event: 'unknown', data: {} }).success, false);
  assert.equal(
    SpeechToSpeechEventSchema.safeParse({ direction: 'ctob', event: 'audioInput', data: { blobs: 'AAAA' } }).success,
    false
  );
});

test('accepts command and URL MCP servers, and the empty config', () => {
  assert.ok(mcpConfigSchema.safeParse(EmptyMcpConfig).success);
  assert.ok(
    mcpConfigSchema.safeParse({
      mcpServers: {
        fetch: { command: 'uvx', args: ['mcp-server-fetch'] },
        wiki: { url: 'https://mcp.deepwiki.com/sse', enabled: false },
      },
    }).success
  );
});
