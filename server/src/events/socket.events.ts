import { Server as SocketIOServer, Socket } from 'socket.io';
import { handleIdentify, handleUpdateScore, handleGetPlayers, handleDisconnect, handleEndGame } from '../handlers/player.handler';
import { handleGetInitialWords, handleGetWordMeaning, handleRequestSuggestions, handleSearchWords } from '../handlers/word.handler';
import { handleChooseWord } from '../handlers/game.handler';
import { handleSubmitDefinition } from '../handlers/definition.handler';

export function registerGameEvents(io: SocketIOServer, socket: Socket): void {
  handleIdentify(io, socket, { profile: 'host', playerName: '' });
  socket.on('identify', (data) => handleIdentify(io, socket, data));

  socket.on('endGame', () => handleEndGame(io, socket));

  socket.on('updateScore', (data) => handleUpdateScore(io, socket, data));

  socket.on('getPlayers', () => handleGetPlayers(io, socket));

  socket.on('getInitialWords', (data) => handleGetInitialWords(io, socket, data));

  socket.on('getWordMeaning', (data) => handleGetWordMeaning(io, socket, data));

  socket.on('requestSuggestions', (data) => handleRequestSuggestions(io, socket, data));

  socket.on('searchWords', (data) => handleSearchWords(io, socket, data));

  socket.on('CHOOSE_WORD', (data) => handleChooseWord(io, socket, data));

  socket.on('SUBMIT_DEFINITION', (data) => handleSubmitDefinition(io, socket, data));

  socket.on('disconnect', () => handleDisconnect(io, socket));

  socket.on('error', (error) => {
    console.error(`[Erro] Socket ${socket.id}:`, error);
  });
}

export function registerHostEvents(io: SocketIOServer, socket: Socket): void {
  socket.on('startGame', () => {
    console.log(`[Jogo] Partida iniciada pelo host`);
    io.emit('gameStarted', { timestamp: new Date().toISOString() });
    io.to('player').emit('startLeaderSelection');
  });

  socket.on('endGame', () => {
    console.log(`[Jogo] Partida finalizada pelo host`);
    io.emit('gameEnded', { timestamp: new Date().toISOString() });
  });

  socket.on('startRound', (data: { word: string; meaning: string }) => {
    console.log(`[Jogo] Rodada iniciada com palavra: ${data.word}`);
    io.emit('roundStarted', {
      word: data.word,
      meaning: data.meaning,
      leaderId: socket.id,
      leaderName: socket.data.playerName,
      timestamp: new Date().toISOString()
    });

    io.to('player').emit('START_WRITING', {
      word: data.word,
      leaderName: socket.data.playerName || 'Líder',
      timestamp: new Date().toISOString()
    });
  });
}
