import { GameState, GameStatus, GameRoom } from '../types/game.types';

let currentGameState: GameState = {
  status: GameStatus.WAITING
};

const gameRooms: Map<string, GameRoom> = new Map();
const definitions: Map<string, string> = new Map();

export function getGameState(): GameState {
  return currentGameState;
}

export function setGameState(state: Partial<GameState>): void {
  currentGameState = { ...currentGameState, ...state };
}

export function updateGameStatus(newStatus: GameStatus): void {
  currentGameState.status = newStatus;
  console.log(`[Game] Status atualizado para: ${newStatus}`);
}

export function resetGameState(): void {
  currentGameState = {
    status: GameStatus.WAITING
  };
  console.log('[Game] Estado do jogo resetado');
}

export function createRoom(roomCode: string): GameRoom {
  const room: GameRoom = {
    roomCode,
    gameState: { status: GameStatus.WAITING },
    players: []
  };
  gameRooms.set(roomCode, room);
  console.log(`[Game] Sala criada: ${roomCode}`);
  return room;
}

export function getRoom(roomCode: string): GameRoom | undefined {
  return gameRooms.get(roomCode);
}

export function deleteRoom(roomCode: string): void {
  gameRooms.delete(roomCode);
  console.log(`[Game] Sala removida: ${roomCode}`);
}

export function addPlayerToRoom(roomCode: string, socketId: string): void {
  const room = gameRooms.get(roomCode);
  if (room && !room.players.includes(socketId)) {
    room.players.push(socketId);
  }
}

export function removePlayerFromRoom(roomCode: string, socketId: string): void {
  const room = gameRooms.get(roomCode);
  if (room) {
    room.players = room.players.filter((id) => id !== socketId);
  }
}

export function getCurrentGameState(): GameState {
  return currentGameState;
}

export function storeDefinition(socketId: string, definition: string): void {
  definitions.set(socketId, definition);
}

export function getDefinition(socketId: string): string | undefined {
  return definitions.get(socketId);
}

export function getAllDefinitions(): Map<string, string> {
  return definitions;
}

export function clearDefinitions(): void {
  definitions.clear();
}
