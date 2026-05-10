import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import { getPlayer } from '../services/player.service';
import { updateGameStatus } from '../services/game.service';
import { GameStatus } from '../types/game.types';
import { findWordById, findWordByText } from '../services/word.service';

export function handleChooseWord(
  io: SocketIOServer,
  socket: Socket,
  data: { wordId: string; wordText: string }
): void {
  const player = getPlayer(socket.id);
  if (!player) {
    socket.emit('error', { message: 'Jogador não encontrado' });
    return;
  }

  if (player.profile !== 'host') {
    socket.emit('error', { message: 'Apenas o líder pode escolher palavras' });
    return;
  }

  const word = findWordById(data.wordId) || findWordByText(data.wordText);
  if (!word) {
    socket.emit('error', { message: 'Palavra não encontrada' });
    return;
  }

  updateGameStatus(GameStatus.WRITING);

  console.log(
    `[Game] Palavra "${word.word}" enviada para a sala. Status: ${GameStatus.WRITING}`
  );

  socket.emit('LEADER_CONFIRMED', {
    status: 'Aguardando definições...',
    message:
      'Sua palavra foi confirmada. Aguarde os outros jogadores enviarem suas definições.',
    timestamp: new Date().toISOString()
  });

  socket.to('player').emit('START_WRITING', {
    word: word.word,
    leaderName: player.name,
    timestamp: new Date().toISOString()
  });

  io.emit('GAME_STATUS_CHANGED', {
    status: GameStatus.WRITING,
    leaderName: player.name,
    timestamp: new Date().toISOString()
  });
}
