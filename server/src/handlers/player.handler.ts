import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import {
  registerPlayer,
  removePlayer,
  updatePlayerScore,
  getAllPlayers
} from '../services/player.service';

export function handleIdentify(
  io: SocketIOServer,
  socket: Socket,
  data: { profile: 'host' | 'player'; playerId?: string; playerName?: string }
): void {
  console.log(`[Identificação] ${socket.id} - Perfil: ${data.profile}`);
  socket.join(data.profile);

  const player = registerPlayer(socket.id, data.playerName || '', data.profile);

  io.emit('playerJoined', {
    socketId: socket.id,
    profile: data.profile,
    playerName: player.name,
    timestamp: new Date().toISOString()
  });

  io.emit('playersList', getAllPlayers());
}

export function handleUpdateScore(
  io: SocketIOServer,
  socket: Socket,
  data: { socketId?: string; score: number }
): void {
  const targetId = data.socketId || socket.id;
  updatePlayerScore(targetId, data.score);
  io.emit('playersList', getAllPlayers());
}

export function handleGetPlayers(io: SocketIOServer, socket: Socket): void {
  socket.emit('playersList', getAllPlayers());
}

export function handleDisconnect(
  io: SocketIOServer,
  socket: Socket
): void {
  console.log(`[Desconexão] Cliente desconectado: ${socket.id}`);
  const playerName = getAllPlayers().find(p => p.socketId === socket.id)?.name;
  removePlayer(socket.id);

  io.emit('playerLeft', {
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  io.emit('playersList', getAllPlayers());

  console.log(`[Desconexão] ${playerName || socket.id} removido do jogo`);
}
