import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import os from 'os';

import { loadWords, getAllWords, getWordCount, getRandomWords, searchWords, clearPlayers } from './services';
import { registerGameEvents, registerHostEvents } from './events';
import { WordsData, Word } from './types/game.types';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

function getLocalIPv4(): string {
  const networkInterfaces = os.networkInterfaces();

  if (!networkInterfaces['Wi-Fi']) {
    return 'Interface Wi-Fi não encontrada';
  }

  for (const addr of networkInterfaces['Wi-Fi']) {
    if (addr.family === 'IPv4') {
      return addr.address;
    }
  }

  return 'IPv4 não encontrado';
}

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/server-info', (req, res) => {
  res.json({
    ip: getLocalIPv4(),
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/words', (req, res) => {
  const random = req.query.random as string;
  if (random !== undefined) {
    const count = parseInt(random) || 3;
    const randomWords = getRandomWords(Math.min(count, getWordCount()));
    return res.json({
      mode: 'random',
      words: randomWords,
      count: randomWords.length,
      timestamp: new Date().toISOString()
    });
  }

  const search = (req.query.search as string || '').toLowerCase().trim();
  if (search) {
    const { results, hasMore } = searchWords(search);
    return res.json({
      mode: 'search',
      query: search,
      count: results.length,
      results,
      hasMore,
      timestamp: new Date().toISOString()
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const allWords = getAllWords();
  const totalItems = allWords.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedWords = allWords.slice(startIndex, endIndex);

  res.json({
    mode: 'paginated',
    data: paginatedWords,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasMore: page < totalPages,
      hasPrevious: page > 1
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/players', (req, res) => {
  const { getAllPlayers } = require('./services');
  const allPlayers = getAllPlayers();

  const hostCount = allPlayers.filter((p: { profile: string }) => p.profile === 'host').length;
  const playerCount = allPlayers.filter((p: { profile: string }) => p.profile === 'player').length;
  const totalScore = allPlayers.reduce((sum: number, p: { score: number }) => sum + p.score, 0);

  res.json({
    timestamp: new Date().toISOString(),
    summary: {
      totalConnected: allPlayers.length,
      hosts: hostCount,
      players: playerCount,
      totalScore: totalScore,
      avgScore: allPlayers.length > 0 ? Math.round(totalScore / allPlayers.length) : 0
    },
    players: allPlayers.map((p: { socketId: string; name: string; score: number; profile: string }) => ({
      socketId: p.socketId,
      name: p.name,
      score: p.score,
      profile: p.profile,
      joinedAt: p.name ? new Date().toISOString() : null
    }))
  });
});

app.get('/playground', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pantim Socket.io Playground</title>
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #eee; padding: 20px; }
    h1 { color: #00d9ff; margin-bottom: 10px; }
    h2 { color: #ff6b6b; margin: 20px 0 10px; }
    .container { max-width: 800px; margin: 0 auto; }
    .section { background: #16213e; padding: 15px; margin: 10px 0; border-radius: 8px; }
    button { background: #0f3460; color: #fff; border: 1px solid #e94560; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer; transition: 0.2s; }
    button:hover { background: #e94560; }
    input { background: #0f3460; border: 1px solid #533483; color: #fff; padding: 10px; border-radius: 5px; margin: 5px; width: 200px; }
    #output { background: #0d0d0d; padding: 15px; border-radius: 8px; height: 300px; overflow-y: auto; font-family: monospace; font-size: 13px; }
    .log { margin: 3px 0; }
    .log-join { color: #00ff88; }
    .log-leave { color: #ff6b6b; }
    .log-list { color: #00d9ff; }
    .log-error { color: #ff0000; }
    .players-list { background: #0d0d0d; padding: 10px; margin-top: 10px; border-radius: 5px; }
    .player { display: inline-block; background: #16213e; padding: 5px 10px; margin: 3px; border-radius: 3px; border: 1px solid #533483; }
    .score { color: #ffd700; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎮 Pantim Socket.io Playground</h1>
    <p>Status: <span id="status">Desconectado</span></p>

    <div class="section">
      <h2>Identificação</h2>
      <input type="text" id="playerName" placeholder="Nome do jogador" value="TestPlayer">
      <select id="profile" style="background:#0f3460;color:#fff;border:1px solid #533483;padding:10px;border-radius:5px;">
        <option value="player">Player</option>
        <option value="host">Host</option>
      </select>
      <button onclick="identify()">Identificar</button>
    </div>

    <div class="section">
      <h2>Pontuação</h2>
      <select id="playerSelect" style="background:#0f3460;color:#fff;border:1px solid #533483;padding:10px;border-radius:5px;min-width:150px;">
        <option value="">Selecione um jogador</option>
      </select>
      <input type="number" id="scoreValue" placeholder="Pontuação" value="0">
      <button onclick="updateScore()">Atualizar Pontuação</button>
    </div>

    <div class="section">
      <h2>PlayersStore</h2>
      <button onclick="getPlayers()">Listar Jogadores</button>
      <button onclick="clearStore()">Limpar Store</button>
      <div class="players-list" id="playersList">Nenhum jogador</div>
    </div>

    <div class="section">
      <h2>Eventos</h2>
      <button onclick="sendMessage()">Enviar Mensagem</button>
      <button onclick="disconnect()">Desconectar</button>
      <button onclick="connect()">Conectar</button>
    </div>

    <div class="section">
      <h2>Output</h2>
      <button onclick="clearOutput()">Limpar</button>
      <div id="output"></div>
    </div>
  </div>

  <script>
    let socket;
    const output = document.getElementById('output');
    const statusEl = document.getElementById('status');
    const playersListEl = document.getElementById('playersList');

    function log(msg, type = '') {
      const div = document.createElement('div');
      div.className = 'log ' + type;
      div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
      output.appendChild(div);
      output.scrollTop = output.scrollHeight;
    }

    function connect() {
      if (socket?.connected) return;
      socket = io();

      socket.on('connect', () => {
        log('Conectado: ' + socket.id, 'log-join');
        statusEl.textContent = 'Conectado (' + socket.id + ')';
        statusEl.style.color = '#00ff88';
      });

      socket.on('playerJoined', (data) => {
        log('playerJoined: ' + JSON.stringify(data), 'log-join');
      });

      socket.on('playerLeft', (data) => {
        log('playerLeft: ' + JSON.stringify(data), 'log-leave');
      });

      socket.on('playersList', (players) => {
        log('playersList: ' + JSON.stringify(players), 'log-list');
        renderPlayers(players);
      });

      socket.on('message', (data) => {
        log('message: ' + JSON.stringify(data));
      });

      socket.on('disconnect', () => {
        log('Desconectado', 'log-leave');
        statusEl.textContent = 'Desconectado';
        statusEl.style.color = '#ff6b6b';
      });

      socket.on('connect_error', (err) => {
        log('Erro: ' + err.message, 'log-error');
      });
    }

    function renderPlayers(players) {
      if (!players.length) {
        playersListEl.textContent = 'Nenhum jogador';
        return;
      }
      playersListEl.innerHTML = players.map(p =>
        '<span class="player">' + p.name + ' <span class="score">[' + p.score + ']</span> (' + p.profile + ')</span>'
      ).join('');

      const select = document.getElementById('playerSelect');
      const currentVal = select.value;
      select.innerHTML = '<option value="">Selecione um jogador</option>' +
        players.map(p => '<option value="' + p.socketId + '">' + p.name + ' [' + p.score + ']</option>').join('');
      if (currentVal && players.find(p => p.socketId === currentVal)) {
        select.value = currentVal;
      }
    }

    function identify() {
      const name = document.getElementById('playerName').value;
      const profile = document.getElementById('profile').value;
      log('Enviando identify: ' + name + ' - ' + profile);
      socket.emit('identify', { profile, playerName: name });
    }

    function updateScore() {
      const socketId = document.getElementById('playerSelect').value;
      const score = parseInt(document.getElementById('scoreValue').value);
      if (!socketId) {
        log('Selecione um jogador primeiro', 'log-error');
        return;
      }
      log('Enviando updateScore para ' + socketId + ': ' + score);
      socket.emit('updateScore', { socketId, score });
    }

    function getPlayers() {
      log('Enviando getPlayers');
      socket.emit('getPlayers');
    }

    function sendMessage() {
      socket.emit('message', { text: 'Olá do playground!' });
      log('Mensagem enviada');
    }

    function disconnect() {
      socket.disconnect();
    }

    function clearStore() {
      log('ClearStore não implementado no servidor (aguarde desconexão)');
    }

    function clearOutput() {
      output.innerHTML = '';
    }

    connect();
  </script>
</body>
</html>`);
});

const localIPv4 = getLocalIPv4();
console.log(`Endereço IPv4 local: ${localIPv4}`);

loadWords();

io.on('connection', (socket: Socket) => {
  console.log(`[Conexão] Novo cliente conectado: ${socket.id}`);

  registerGameEvents(io, socket);
  registerHostEvents(io, socket);

  socket.on('message', (data) => {
    console.log(`[Mensagem] De ${socket.id}:`, data);
    io.emit('message', {
      from: socket.id,
      data,
      timestamp: new Date().toISOString()
    });
  });
});

httpServer.listen(
  { port: PORT as number, host: HOST },
  () => {
    console.log('╔════════════════════════════════════╗');
    console.log('║       🎮 PANTIM SERVER 🎮         ║');
    console.log('╚════════════════════════════════════╝');
    console.log(`✓ Servidor rodando em ${HOST}:${PORT}`);
    console.log(`✓ WebSocket (Socket.io) ativo`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log(`\n📡 Aguardando conexões...\n`);
  }
);

const shutdown = () => {
  console.log('\n[Shutdown] Encerrando servidor...');
  clearPlayers();
  httpServer.close(() => {
    console.log('✓ Servidor encerrado');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
