'use client';

import { useEffect, useMemo, useState } from 'react';

import { Room, RoomEvent } from 'livekit-client';
import { motion } from 'motion/react';

import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';

import { toastAlert } from '@/components/alert-toast';
import { SessionView } from '@/components/session-view';
import { Toaster } from '@/components/ui/sonner';
import { Welcome } from '@/components/welcome';
import useConnectionDetails from '@/hooks/useConnectionDetails';
import type { AppConfig } from '@/lib/types';

const MotionWelcome = motion.create(Welcome);
const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionMode, setSessionMode] = useState<'chat' | 'voice'>('chat');
  const [currentView, setCurrentView] = useState<'welcome' | 'session'>('welcome');
  const { refreshConnectionDetails, existingOrRefreshConnectionDetails } =
    useConnectionDetails(appConfig);

  // Setup LiveKit room event listeners for disconnection and media errors
  useEffect(() => {
    const onDisconnected = () => {
      setSessionMode('chat');
      setCurrentView('welcome'); // Also hide UI to go back to welcome screen
      refreshConnectionDetails();
    };
    const onMediaDevicesError = (error: Error) => {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails]);

  // Auto-connect to LiveKit room when voice mode is activated
  useEffect(() => {
    let aborted = false;
    if (sessionMode === 'voice' && room.state === 'disconnected') {
      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: appConfig.isPreConnectBufferEnabled,
        }),
        existingOrRefreshConnectionDetails().then((connectionDetails) =>
          room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
        ),
      ]).catch((error) => {
        if (aborted) {
          // Once the effect has cleaned up after itself, drop any errors
          //
          // These errors are likely caused by this effect rerunning rapidly,
          // resulting in a previous run `disconnect` running in parallel with
          // a current run `connect`
          return;
        }

        toastAlert({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      });
    }
    return () => {
      aborted = true;
      room.disconnect();
    };
  }, [room, sessionMode, appConfig.isPreConnectBufferEnabled, existingOrRefreshConnectionDetails]);

  const { startButtonText, startChatButtonText } = appConfig;

  // Handle user-initiated disconnection (resets to welcome screen)
  const handleDisconnect = () => {
    setSessionMode('chat');
    setCurrentView('welcome');
  };

  return (
    <main>
      <MotionWelcome
        key="welcome"
        startButtonText={startButtonText}
        startChatButtonText={startChatButtonText}
        onStartCall={() => {
          setCurrentView('session');
          setSessionMode('voice');
        }}
        onStartChat={() => {
          setCurrentView('session');
          setSessionMode('chat');
        }}
        disabled={currentView === 'session'}
        initial={{ opacity: 1 }}
        animate={{ opacity: currentView === 'session' ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'linear', delay: currentView === 'session' ? 0 : 0.5 }}
      />

      <RoomContext.Provider value={room}>
        <RoomAudioRenderer />
        <StartAudio label="Start Audio" />
        {/* --- */}
        <MotionSessionView
          key="session-view"
          appConfig={appConfig}
          disabled={currentView === 'welcome'}
          sessionMode={sessionMode}
          onDisconnect={handleDisconnect}
          initial={{ opacity: 0 }}
          animate={{ opacity: currentView === 'session' ? 1 : 0 }}
          transition={{
            duration: 0.5,
            ease: 'linear',
            delay: currentView === 'session' ? 0.5 : 0,
          }}
        />
      </RoomContext.Provider>

      <Toaster />
    </main>
  );
}
