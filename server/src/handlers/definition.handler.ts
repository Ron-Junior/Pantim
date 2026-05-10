import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import { getPlayer } from '../services/player.service';
import { getCurrentGameState, storeDefinition } from '../services/game.service';
import { GameStatus } from '../types/game.types';

const pendingDefinitions: Map<string, string> = new Map();

export function handleSubmitDefinition(
  io: SocketIOServer,
  socket: Socket,
  data: { definition: string; timestamp: string }
): void {
  const player = getPlayer(socket.id);
  if (!player) {
    socket.emit('error', 'Jogador não encontrado');
    return;
  }

  const gameState = getCurrentGameState();
  if (!gameState || gameState.status !== GameStatus.WRITING) {
    socket.emit('error', 'Não é possível enviar definições neste momento');
    return;
  }

  if (!data.definition || data.definition.trim().length === 0) {
    socket.emit('error', 'A definição não pode estar vazia');
    return;
  }

  storeDefinition(socket.id, data.definition.trim());

  console.log(`[Definition] ${player.name} enviou: "${data.definition.trim()}"`);

  socket.emit('definitionSubmitted', {
    success: true,
    timestamp: new Date().toISOString()
  });

  io.emit('PLAYER_SUBMITTED_DEFINITION', {
    socketId: socket.id,
    playerName: player.name,
    timestamp: new Date().toISOString()
  });
}
