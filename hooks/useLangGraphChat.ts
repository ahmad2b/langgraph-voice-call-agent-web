'use client';

import { useMemo } from 'react';
import type { Message } from '@langchain/langgraph-sdk';
import { useStream } from '@langchain/langgraph-sdk/react';
import type { ReceivedChatMessage } from '@livekit/components-react';

type UseLangGraphChatParams = {
  apiUrl?: string;
  assistantId?: string;
  messagesKey?: string;
};

type UseLangGraphChatResult = {
  messages: ReceivedChatMessage[];
  send: (text: string) => Promise<void>;
};

/**
 * Lightweight adapter around LangGraph useStream that presents
 * messages and send() in the same shape our chat UI expects.
 */
export default function useLangGraphChat(params: UseLangGraphChatParams): UseLangGraphChatResult {
  const { apiUrl, assistantId, messagesKey = 'messages' } = params;

  const stream = useStream<{ messages: Message[] }>({
    apiUrl,
    assistantId: assistantId ?? '',
    messagesKey,
  });

  const mappedMessages = useMemo<ReceivedChatMessage[]>(() => {
    const now = Date.now();
    return (stream.messages ?? []).map((m, idx) => {
      const isHuman = (m as any).type === 'human';
      return {
        id: (m as any).id ?? `${now}-${idx}`,
        message: String((m as any).content ?? ''),
        timestamp: now + idx,
        from: {
          identity: isHuman ? 'you' : 'agent',
          name: isHuman ? 'You' : 'Agent',
          isLocal: isHuman,
        } as any,
      } as unknown as ReceivedChatMessage;
    });
  }, [stream.messages]);

  async function send(text: string) {
    if (!text || !assistantId || !apiUrl) return;
    const newMessage = { type: 'human', content: text } as any;
    stream.submit(
      { messages: [newMessage] },
      {
        optimisticValues(prev) {
          const prevMessages = (prev as any)?.messages ?? [];
          return { ...(prev as any), messages: [...prevMessages, newMessage] } as any;
        },
      }
    );
  }

  return { messages: mappedMessages, send };
}
