import { MessageEntity } from './dynamodb';

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export class MessageRepository {
  /**
   * Saves a new message
   * @param sessionId Session ID
   * @param message Message object
   * @returns Saved message
   */
  async saveMessage(sessionId: string, message: { role: 'user' | 'assistant'; content: string }) {
    const timestamp = Date.now();
    await MessageEntity.put({
      sessionId,
      role: message.role,
      content: message.content,
      timestamp,
    }).go();
  }

  /**
   * Gets all messages belonging to a session
   * @param sessionId Session ID
   * @returns Array of messages
   */
  async getMessages(sessionId: string): Promise<Message[]> {
    const result = await MessageEntity.query.byTimestamp({ sessionId }).go({ pages: 'all' });

    return result.data.map((item) => ({
      role: item.role as 'system' | 'user' | 'assistant',
      content: item.content,
      timestamp: item.timestamp,
    }));
  }
}
