'use client';

import { toastAlert } from '@/components/alert-toast';
import { AgentControlBar } from '@/components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import { MediaTiles } from '@/components/livekit/media-tiles';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import useLangGraphChat from '@/hooks/useLangGraphChat';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';

function isAgentAvailable(agentState: AgentState): boolean {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionMode: 'chat' | 'voice';
  onDisconnect?: () => void;
}

/**
 * SessionView Component - Handles both chat-only and voice call sessions
 * 
 * Conditional Rendering:
 * - Chat-only mode: Shows only chat interface
 * - Voice mode: Shows chat + media tiles + video controls + top background
 */
export const SessionView = ({
  appConfig,
  disabled,
  sessionMode,
  onDisconnect,
  ref,
}: React.ComponentProps<'div'> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(false);
  
  // LiveKit chat+transcription for voice call mode
  const livekit = useChatAndTranscription();
  // LangGraph chat for chat-only mode
  const langgraph = useLangGraphChat({
    apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL,
    assistantId: process.env.NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID,
  });
  
  // Select message source based on session mode
  const messages = sessionMode === 'voice' ? livekit.messages : langgraph.messages;
  const room = useRoomContext();

  useDebugMode({
    enabled: process.env.NODE_END !== 'production',
  });

  async function handleSendMessage(message: string) {
    if (sessionMode === 'voice') {
      await livekit.send(message);
    } else {
      await langgraph.send(message);
    }
  }

  function handleDisconnect() {
    if (sessionMode === 'voice') {
      room.disconnect(); // This will trigger the onDisconnected event in App.tsx
    } else {
      // In chat-only mode, call the parent's disconnect handler
      onDisconnect?.();
    }
  }

  useEffect(() => {
    if (sessionMode === 'voice') {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === 'connecting'
              ? 'Agent did not join the room. '
              : 'Agent connected but did not complete initializing. ';

          toastAlert({
            title: 'Session ended',
            description: (
              <p className="w-full">
                {reason}
                Please check your agent connection and try again.
              </p>
            ),
          });
          room.disconnect();
        }
      }, 20_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionMode, room]);

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  // Expose chat input in non-call mode by forcing chat area open
  useEffect(() => {
    if (sessionMode === 'chat') {
      setChatOpen(true);
    }
  }, [sessionMode]);

  return (
    <section
      ref={ref}
      inert={disabled}
      className={cn(
        'opacity-0',
        // prevent page scrollbar
        // when !chatOpen due to 'translate-y-20'
        !chatOpen && 'max-h-svh overflow-hidden'
      )}
    >
      <ChatMessageView
        className={cn(
          'mx-auto min-h-svh w-full max-w-2xl px-3 transition-[opacity,translate] duration-300 ease-out md:px-0 pb-40 md:pb-48',
          // Adjust spacing based on session mode
          sessionMode === 'voice' 
            ? 'pt-32 md:pt-36'  // Space for media tiles in voice mode
            : 'pt-20 md:pt-24 ', // Reduced spacing for chat-only mode
          chatOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-20 opacity-0'
        )}
      >
        <div className="space-y-3 whitespace-pre-wrap">
          <AnimatePresence>
            {messages.map((message: ReceivedChatMessage) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 1, height: 'auto', translateY: 0.001 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <ChatEntry hideName key={message.id} entry={message} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ChatMessageView>

      {/* Top background overlay - only show in voice mode for media tiles */}
      {sessionMode === 'voice' && (
        <div className="bg-background mp-12 fixed top-0 right-0 left-0 h-32 md:h-36">
          {/* skrim */}
          <div className="from-background absolute bottom-0 left-0 h-12 w-full translate-y-full bg-gradient-to-b to-transparent" />
        </div>
      )}

      {/* Media tiles - only show in voice mode */}
      {sessionMode === 'voice' && <MediaTiles chatOpen={chatOpen} />}

      <div className="bg-background fixed right-0 bottom-0 left-0 z-50 px-3 pt-2 pb-3 md:px-12 md:pb-12">
        <motion.div
          key="control-bar"
          initial={{ opacity: 0, translateY: '100%' }}
          animate={{
            opacity: 1, // Always show control bar when UI is visible
            translateY: '0%',
          }}
          transition={{ duration: 0.3, delay: 0.5, ease: 'easeOut' }}
        >
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            {appConfig.isPreConnectBufferEnabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: sessionMode === 'voice' && messages.length === 0 ? 1 : 0,
                  transition: {
                    ease: 'easeIn',
                    delay: messages.length > 0 ? 0 : 0.8,
                    duration: messages.length > 0 ? 0.2 : 0.5,
                  },
                }}
                aria-hidden={messages.length > 0}
                className={cn(
                  'absolute inset-x-0 -top-12 text-center',
                  sessionMode === 'voice' && messages.length === 0 && 'pointer-events-none'
                )}
              >
                <p className="animate-text-shimmer inline-block !bg-clip-text text-sm font-semibold text-transparent">
                  Agent is listening, ask it a question
                </p>
              </motion.div>
            )}

            <AgentControlBar
              capabilities={capabilities}
              controls={{
                chat: true, // Force chat control to be visible
                leave: true, // Always show disconnect/back button
                microphone: sessionMode === 'voice',
                camera: sessionMode === 'voice',
                screenShare: sessionMode === 'voice',
              }}
              onChatOpenChange={setChatOpen}
              onSendMessage={handleSendMessage}
              onDisconnect={handleDisconnect}
              defaultChatOpen={sessionMode === 'chat'}
            />
          </div>
          {/* skrim */}
          <div className="from-background border-background absolute top-0 left-0 h-12 w-full -translate-y-full bg-gradient-to-t to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};
