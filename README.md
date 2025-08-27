# LangGraph Voice Call Agent Web

A real-time voice/call AI agent UI that lets you talk to a LangGraph agent over LiveKit — similar to "voice mode" experiences in ChatGPT Voice, OpenAI Realtime API sessions, and Gemini Live. This repo demonstrates adapting a LangGraph agent into a full-duplex, low-latency voice assistant using LiveKit's real-time communication infrastructure.

This frontend provides a seamless interface for both text chat and voice calls with your LangGraph agent, built with Next.js and LiveKit's real-time communication platform.


### Features

- Real-time voice interaction with LangGraph agents
- Audio visualization and level monitoring
- Light/dark theme switching with system preference detection
- Customizable branding, colors, and UI text via configuration

This application is built with Next.js and LiveKit's real-time communication platform, providing a production-ready interface for your LangGraph voice agent.

### Project structure

```
langgraph-voice-call-agent-web/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   └── connection-details/
│   │       └── route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── livekit/
│   │   ├── agent-control-bar/
│   │   │   ├── agent-control-bar.tsx
│   │   │   └── hooks/
│   │   │       ├── use-agent-control-bar.ts
│   │   │       └── use-publish-permissions.ts
│   │   ├── agent-tile.tsx
│   │   ├── avatar-tile.tsx
│   │   ├── chat/
│   │   │   ├── chat-entry.tsx
│   │   │   └── chat-message-view.tsx
│   │   ├── device-select.tsx
│   │   ├── media-tiles.tsx
│   │   ├── track-toggle.tsx
│   │   └── video-tile.tsx
│   ├── app.tsx
│   ├── provider.tsx
│   ├── session-view.tsx
│   ├── theme-toggle.tsx
│   └── welcome.tsx
├── hooks/
│   ├── useChatAndTranscription.ts
│   ├── useConnectionDetails.ts
│   ├── useDebug.ts
│   └── useLangGraphChat.ts
├── lib/
│   ├── types.ts
│   └── utils.ts
├── public/
└── package.json
```

## Getting started

This application is designed to work with your existing LiveKit backend and LangGraph agent. You'll need:

1. **LiveKit Server** - Your backend that provides real-time communication services
2. **LangGraph Agent** - Your AI agent that processes conversations
3. **Environment Configuration** - API keys and endpoints

```bash
git clone https://github.com/ahmad2b/langgraph-voice-call-agent-web.git
cd langgraph-voice-call-agent-web
```

Then run the app with:

```bash
npm install
npm run dev
```

And open http://localhost:3000 in your browser.

You'll also need to configure your LangGraph agent to work with LiveKit's real-time communication platform. The application supports both text chat and voice interactions through the same interface.

## Configuration

This application is designed to work seamlessly with your LangGraph agent through LiveKit's real-time communication platform. You can easily configure it to work with different types of inputs and outputs:

#### Example: App configuration (`app-config.ts`)

```ts
export const APP_CONFIG_DEFAULTS = {
  appName: 'LangGraph Voice Agent',
  pageTitle: 'LangGraph Voice Call Agent',
  pageDescription:
    "A real-time voice/call AI agent that lets you talk to a LangGraph agent over LiveKit's real-time communication platform",

  supportsChatInput: true,
  supportsVideoInput: false,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/your-logo.svg',
  accent: '#002cf2',
  logoDark: '/your-logo-dark.svg',
  accentDark: '#1fd5f9',
  startButtonText: 'Start Voice Call',
  startChatButtonText: 'Start Chat',

  agentName: undefined,
};
```

You can update these values in [`app-config.ts`](./app-config.ts) to customize branding, features, and UI text for your deployment.

#### Environment Variables

You'll also need to configure your LiveKit credentials in `.env.local` (copy `.env.example` if you don't have one):

```env
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=https://your-livekit-server-url
```

## How it works (high level)

1. User presses Start Voice Call → the app primes the microphone and connects to a LiveKit room using server-issued credentials.
2. The `Room` is provided via React context. The UI renders the agent’s audio visualization, messages, and a control bar.
3. In call mode, messages are a merge of LiveKit chat and live transcriptions; in chat-only mode, messages come from the LangGraph SDK stream.

## Token issuance (server)

The API route at `app/api/connection-details/route.ts` issues a 15-minute LiveKit access token and returns:

```ts
type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};
```

The route validates required env vars, generates a random room and identity, and returns the `serverUrl` and `participantToken`. If `agentName` is provided in the request body, it is added to the room configuration.

## Runtime flow (concrete)

- `components/app.tsx`
  - Creates a `Room` (livekit-client) and, when starting a call from a disconnected state, does two things in parallel:
    1) `setMicrophoneEnabled(true, { preConnectBuffer })`
    2) `room.connect(serverUrl, participantToken)` (credentials come from `useConnectionDetails`)
  - Subscribes to `RoomEvent.MediaDevicesError` and `RoomEvent.Disconnected` for user feedback and UI reset.

- `hooks/useConnectionDetails.ts`
  - Fetches `{ serverUrl, participantToken }` from `NEXT_PUBLIC_CONN_DETAILS_ENDPOINT` or the local API route.
  - Sends `X-Sandbox-Id` when available.
  - Proactively refreshes credentials when near expiry (based on JWT exp).

- `components/session-view.tsx`
  - Uses `useVoiceAssistant()` (from `@livekit/components-react`) to monitor the agent and access its audio/video tracks.
  - In call mode, merges LiveKit transcriptions + chat (`useTranscriptions` + `useChat` via `useChatAndTranscription`).
  - Includes a safety timeout to disconnect if the agent doesn’t initialize promptly.

- `components/livekit/agent-control-bar/*`
  - Media controls: mic/cam/screen toggles (`useTrackToggle`), device selection (`useMediaDeviceSelect`), and persistence of user choices (`usePersistentUserChoices`).

- `components/livekit/media-tiles.tsx`
  - Renders the agent’s audio visualization and handles layout transitions.

## Minimal vs extended setup

Minimum you need to place a voice call:
- LiveKit env vars set and the `/api/connection-details` route available.
- Create a `Room`, call `setMicrophoneEnabled(true)`, then `room.connect(serverUrl, participantToken)`.
- Render `<RoomAudioRenderer />` and gate autoplay with `<StartAudio />`.
- Provide the `Room` via context and render a basic visualizer (e.g., `BarVisualizer` from `useVoiceAssistant`).

Extended features included here:
- Pre-connect mic buffer toggle (`isPreConnectBufferEnabled`).
- Unified message surface (merged transcriptions + chat) during calls.
- Control bar with device selection, permission-aware toggles, and persistence.
- Media tiles with animated layout.

## Features

### **Current Capabilities**

- **Voice Calls**: Full-duplex voice conversations with your LangGraph agent
- **Text Chat**: Direct text messaging with the agent
- **Real-time Transcription**: Live speech-to-text conversion
- **Responsive Design**: Works on desktop and mobile devices
- **Theme Support**: Light/dark mode with system preference detection

### **Architecture**

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Voice Infrastructure**: LiveKit's real-time communication platform
- **Agent Integration**: Direct connection to your LiveKit backend
- **State Management**: React hooks for chat and transcription

## Contributing

This project is open source and we welcome contributions! Please open a PR or issue through GitHub.

## Connect

I’m actively exploring voice-first and real-time agents. If you’re building in this space or experimenting real-time AI infra, I'd love to trade ideas, collaborate or help out.

- GitHub: [ahmad2b](https://github.com/ahmad2b)  
- Twitter/X: [@mahmad2b](https://x.com/mahmad2b)  
- LinkedIn: [Ahmad Shaukat](https://www.linkedin.com/in/ahmad2b)  
- Book a chat: [cal.com/mahmad2b/15min](https://cal.com/mahmad2b/15min)  