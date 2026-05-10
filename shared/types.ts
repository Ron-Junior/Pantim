/**
 * Tipos compartilhados entre Server e Client
 * Mantém sincronização de tipos entre frontend e backend
 */

export type UserProfile = 'host' | 'player';

export interface IdentifyPayload {
  profile: UserProfile;
  playerId?: string;
  playerName?: string;
}

export interface PlayerJoinedEvent {
  socketId: string;
  profile: UserProfile;
  timestamp: string;
}

export interface PlayerLeftEvent {
  socketId: string;
  timestamp: string;
}

export interface MessageEvent {
  from: string;
  data: unknown;
  timestamp: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  corsOrigin: string | string[];
}

export interface GameState {
  isActive: boolean;
  roundNumber: number;
  currentPhase: 'waiting' | 'playing' | 'voting' | 'results';
  players: Map<string, PlayerInfo>;
}

export interface PlayerInfo {
  socketId: string;
  name: string;
  profile: UserProfile;
  isConnected: boolean;
  joinedAt: Date;
}

export interface Player {
  socketId: string;
  name: string;
  score: number;
  profile: UserProfile;
}

export interface PlayersListEvent {
  players: Player[];
}

export interface PlayerJoinedEventExtended extends PlayerJoinedEvent {
  playerName: string;
}

export interface UpdateScorePayload {
  score: number;
}
