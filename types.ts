export enum AssistantMode {
  VISUAL_AID = 'VISUAL_AID', // Standard description
  SOCIAL_EYE = 'SOCIAL_EYE', // Emotion and social cue detection
  NAVIGATION = 'NAVIGATION', // Obstacle and hazard detection
  SIGN_INTERPRETER = 'SIGN_INTERPRETER', // Translates gestures
  AUDITORY_ASSISTANT = 'AUDITORY_ASSISTANT', // Visualizes sound/speech
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  sender: 'JARVIS' | 'USER' | 'SYSTEM' | 'KESTRA';
  message: string;
  type: 'info' | 'alert' | 'success' | 'transcription' | 'workflow';
}

export interface KestraFlow {
  id: string;
  name: string;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  tasks: { id: string; name: string; status: 'PENDING' | 'RUNNING' | 'COMPLETED' }[];
}

export interface AgentResult {
  summary: string;
  decision: 'NORMAL' | 'WARNING' | 'CRITICAL';
  data_source: string;
}