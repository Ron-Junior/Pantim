export interface Player {
  socketId: string;
  name: string;
  score: number;
  profile: 'host' | 'player';
  isLeader?: boolean;
}

export interface Word {
  word: string;
  meaning: string;
}

export interface WordsData {
  words: Word[];
}

export enum GameStatus {
  WAITING = 'WAITING',
  LEADER_SELECTION = 'LEADER_SELECTION',
  WRITING = 'WRITING',
  VOTING = 'VOTING',
  RESULTS = 'RESULTS'
}

export interface GameState {
  status: GameStatus;
  currentWordId?: string;
  currentWord?: string;
  leaderSocketId?: string;
  leaderName?: string;
  roomCode?: string;
}

export interface GameRoom {
  roomCode: string;
  gameState: GameState;
  players: string[];
}

export interface SocketData {
  playerId?: string;
  playerName?: string;
  profile?: 'host' | 'player';
  roomCode?: string;
}
