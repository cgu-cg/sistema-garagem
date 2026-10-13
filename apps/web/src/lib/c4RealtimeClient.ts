import { io } from 'socket.io-client';
import { createRealtimeSession } from './realtimeSession';

export const c4Realtime = createRealtimeSession(token => io({
  path: '/api/socket.io', auth: { token }, autoConnect: false, reconnection: true,
}));
