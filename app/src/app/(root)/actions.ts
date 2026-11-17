'use server';

import { z } from 'zod';
import { SessionRepository } from '@/common/sessionRepository';
import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from '@aws-sdk/client-bedrock-agentcore';
import { authActionClient } from '@/lib/safe-action';
import { EmptyMcpConfig } from '@/common/schemas';
import { defaultSystemPrompt } from '@/lib/systemPrompt';
import { englishVoices } from '@/lib/voices';

const agentCore = new BedrockAgentCoreClient({});

const startNovaSonicSessionSchema = z.object({
  voiceId: z.string().refine((id) => englishVoices.some((voice) => voice.id === id), 'Unsupported voice'),
});

export const startNovaSonicSession = authActionClient
  .inputSchema(startNovaSonicSessionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.userId;
    const sessionRepository = new SessionRepository();

    // Create new session in DynamoDB
    const session = await sessionRepository.createSession(userId, EmptyMcpConfig);

    // Prepare payload for Nova Sonic Lambda
    const payload = {
      sessionId: session.sessionId,
      userId: session.userId,
      systemPrompt: defaultSystemPrompt,
      voiceId: parsedInput.voiceId,
      mcpConfig: EmptyMcpConfig,
    };

    try {
      const res = await agentCore.send(
        new InvokeAgentRuntimeCommand({
          agentRuntimeArn: process.env.AGENT_CORE_RUNTIME_ARN,
          runtimeSessionId: session.sessionId,
          payload: JSON.stringify(payload),
          contentType: 'application/json',
        })
      );

      return {
        success: true,
        sessionId: session.sessionId,
        message: 'Nova Sonic processing initiated successfully',
      };
    } catch (error) {
      console.error('Failed to invoke Nova Sonic Lambda:', error);

      // Clean up the session if Lambda invocation fails
      await sessionRepository.deleteSession(userId, session.sessionId);

      throw new Error('Failed to start Nova Sonic processing');
    }
  });
