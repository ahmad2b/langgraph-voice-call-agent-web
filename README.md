# LangGraph Voice Call Agent Web

A real-time voice/call AI agent that lets you talk to a LangGraph agent over LiveKit — similar to "voice mode" experiences in ChatGPT Voice, OpenAI Realtime API sessions, and Gemini Live. This repo demonstrates adapting any LangGraph agent into a full-duplex, low-latency voice assistant using LiveKit's real-time communication infrastructure.

This frontend provides a seamless interface for both text chat and voice calls with your LangGraph agent, built with Next.js and LiveKit's real-time communication platform.

<picture>
  <source srcset="./public/your-app-screenshot-dark.webp" media="(prefers-color-scheme: dark)">
  <source srcset="./public/your-app-screenshot-light.webp" media="(prefers-color-scheme: light)">
  <img src="./public/your-app-screenshot-light.webp" alt="LangGraph Voice Call Agent Web Screenshot">
</picture>

### Features:

- Real-time voice interaction with LangGraph agents
- Camera video streaming support
- Screen sharing capabilities
- Audio visualization and level monitoring
- Virtual avatar integration
- Light/dark theme switching with system preference detection
- Customizable branding, colors, and UI text via configuration

This application is built with Next.js and LiveKit's real-time communication platform, providing a production-ready interface for your LangGraph voice agent.

### Project structure

```
langgraph-voice-call-agent-web/
├── app/
│   ├── (app)/
│   ├── api/
│   ├── components/
│   ├── fonts/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── livekit/
│   ├── ui/
│   ├── app.tsx
│   ├── session-view.tsx
│   └── welcome.tsx
├── hooks/
├── lib/
├── public/
└── package.json
```

## Getting started

This application is designed to work with your existing LiveKit backend and LangGraph agent. You'll need:

1. **LiveKit Server** - Your backend that provides real-time communication services
2. **LangGraph Agent** - Your AI agent that processes conversations
3. **Environment Configuration** - API keys and endpoints

```bash
git clone https://github.com/[your-username]/langgraph-voice-call-agent-web.git
cd langgraph-voice-call-agent-web
```

Then run the app with:

```bash
pnpm install
pnpm dev
```

And open http://localhost:3000 in your browser.

You'll also need to configure your LangGraph agent to work with LiveKit's real-time communication platform. The application supports both text chat and voice interactions through the same interface.

## Configuration

This application is designed to work seamlessly with your LangGraph agent through LiveKit's real-time communication platform. You can easily configure it to work with different types of inputs and outputs:

#### Example: App configuration (`app-config.ts`)

```ts
export const APP_CONFIG_DEFAULTS = {
  companyName: 'LangGraph Voice Agent',
  pageTitle: 'LangGraph Voice Call Agent',
  pageDescription:
    "A real-time voice/call AI agent that lets you talk to a LangGraph agent over LiveKit's real-time communication platform",
  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  logo: '/your-logo.svg',
  accent: '#002cf2',
  logoDark: '/your-logo-dark.svg',
  accentDark: '#1fd5f9',
  startButtonText: 'Start Voice Call',
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

These are required for the voice agent functionality to work with your LiveKit real-time communication project.

## Features

### **Current Capabilities**

- **Voice Calls**: Full-duplex voice conversations with your LangGraph agent
- **Text Chat**: Direct text messaging with the agent
- **Video Support**: Camera and screen sharing capabilities
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
