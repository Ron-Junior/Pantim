import { Player } from '../types/game.types';

const playersStore: Map<string, Player> = new Map();

export function registerPlayer(
  socketId: string,
  name: string,
  profile: 'host' | 'player'
): Player {
  const player: Player = {
    socketId,
    name: name || `Jogador ${playersStore.size + 1}`,
    score: 0,
    profile
  };
  playersStore.set(socketId, player);
  console.log(
    `[PlayersStore] Jogador registrado: ${player.name} (${socketId}) - Pontuação: ${player.score}`
  );
  return player;
}

export function removePlayer(socketId: string): void {
  const player = playersStore.get(socketId);
  if (player) {
    playersStore.delete(socketId);
    console.log(`[PlayersStore] Jogador removido: ${player.name} (${socketId})`);
  }
}

export function getPlayer(socketId: string): Player | undefined {
  return playersStore.get(socketId);
}

export function getAllPlayers(): Player[] {
  return Array.from(playersStore.values());
}

export function updatePlayerScore(socketId: string, score: number): void {
  const player = playersStore.get(socketId);
  if (player) {
    player.score = score;
    console.log(`[PlayersStore] Pontuação atualizada: ${player.name} -> ${score}`);
  }
}

export function setPlayerAsLeader(socketId: string, isLeader: boolean): void {
  const player = playersStore.get(socketId);
  if (player) {
    player.isLeader = isLeader;
    console.log(`[PlayersStore] ${player.name} é agora líder: ${isLeader}`);
  }
}
