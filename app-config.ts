import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'LangGraph Voice Agent',
  pageTitle: 'LangGraph Voice Call Agent',
  pageDescription: 'A real-time voice/call AI agent that lets you talk to a LangGraph agent over LiveKit\'s real-time communication platform',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/your-logo.svg',
  accent: '#002cf2',
  logoDark: '/your-logo-dark.svg',
  accentDark: '#1fd5f9',
  startButtonText: 'Start Voice Call',

  agentName: undefined,
};
