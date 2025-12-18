
import { KnowledgeNode, Message } from './types';

export const INITIAL_KNOWLEDGE: KnowledgeNode[] = [];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'system',
    content: 'Cortex Enterprise Engine initialized. Secure vector tunnel established. All queries are encrypted at rest.',
    timestamp: Date.now()
  }
];

export const SAMPLE_RESPONSES = [
  "Based on the analyzed documents, the consensus points to a modular deployment strategy.",
  "Retrieving context... Found relevant data in your private knowledge store.",
];
