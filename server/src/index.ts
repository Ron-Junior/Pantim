import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import os from 'os';
import fs from 'fs';
import path from 'path';

interface Player {
  socketId: string;
  name: string;
  score: number;
  profile: 'host' | 'player';
}

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const playersStore: Map<string, Player> = new Map();

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

function getLocalIPv4() {
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

// Exibe o IPv4 no console
const localIPv4 = getLocalIPv4();
console.log(`Endereço IPv4 local: ${localIPv4}`);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Server info with dynamic IP
app.get('/api/server-info', (req, res) => {
  res.json({
    ip: getLocalIPv4(),
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Carregar palavras do arquivo JSON
interface Word {
  word: string;
  meaning: string;
}

interface WordsData {
  words: Word[];
}

let wordsData: WordsData = { words: [] };

function loadWords(): void {
  try {
    const filePath = path.join(process.cwd(), 'src', 'words.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    wordsData = JSON.parse(fileContent);
    console.log(`[Words] Carregadas ${wordsData.words.length} palavras`);
  } catch (error) {
    console.error('[Words] Erro ao carregar palavras:', error);
    wordsData = { words: [] };
  }
}

loadWords();

// Função para sortear palavras aleatórias
function getRandomWords(count: number): Word[] {
  const shuffled = [...wordsData.words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Rota: Endpoint único para /api/words com query strings
app.get('/api/words', (req, res) => {
  // Modo 1: Modo random - retorna palavras aleatórias
  const random = req.query.random as string;
  if (random !== undefined) {
    const count = parseInt(random) || 3;
    const randomWords = getRandomWords(Math.min(count, wordsData.words.length));
    return res.json({
      mode: 'random',
      words: randomWords,
      count: randomWords.length,
      timestamp: new Date().toISOString()
    });
  }

  // Modo 2: Modo search - pesquisa por palavra ou significado
  const search = (req.query.search as string || '').toLowerCase().trim();
  if (search) {
    const results = wordsData.words.filter(item => 
      item.word.toLowerCase().includes(search) || 
      item.meaning.toLowerCase().includes(search)
    );
    return res.json({
      mode: 'search',
      query: search,
      count: results.length,
      results,
      timestamp: new Date().toISOString()
    });
  }

  // Modo 3: Modo paginado (padrão) - lista com paginação
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const totalItems = wordsData.words.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedWords = wordsData.words.slice(startIndex, endIndex);
  
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

// API: Retorna todos os jogadores conectados com informações detalhadas
app.get('/api/players', (req, res) => {
  const allPlayers = getAllPlayers();
  
  const hostCount = allPlayers.filter(p => p.profile === 'host').length;
  const playerCount = allPlayers.filter(p => p.profile === 'player').length;
  const totalScore = allPlayers.reduce((sum, p) => sum + p.score, 0);
  
  res.json({
    timestamp: new Date().toISOString(),
    summary: {
      totalConnected: allPlayers.length,
      hosts: hostCount,
      players: playerCount,
      totalScore: totalScore,
      avgScore: allPlayers.length > 0 ? Math.round(totalScore / allPlayers.length) : 0
    },
    players: allPlayers.map(p => ({
      socketId: p.socketId,
      name: p.name,
      score: p.score,
      profile: p.profile,
      joinedAt: p.name ? new Date().toISOString() : null
    }))
  });
});

// Playground route
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
      
      // Populate dropdown
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

function registerPlayer(socketId: string, name: string, profile: 'host' | 'player'): Player {
  const player: Player = {
    socketId,
    name: name || `Jogador ${playersStore.size + 1}`,
    score: 0,
    profile
  };
  playersStore.set(socketId, player);
  console.log(`[PlayersStore] Jogador registrado: ${player.name} (${socketId}) - Pontuação: ${player.score}`);
  return player;
}

function removePlayer(socketId: string): void {
  const player = playersStore.get(socketId);
  if (player) {
    playersStore.delete(socketId);
    console.log(`[PlayersStore] Jogador removido: ${player.name} (${socketId})`);
  }
}

function getPlayer(socketId: string): Player | undefined {
  return playersStore.get(socketId);
}

function getAllPlayers(): Player[] {
  return Array.from(playersStore.values());
}

function updatePlayerScore(socketId: string, score: number): void {
  const player = playersStore.get(socketId);
  if (player) {
    player.score = score;
    console.log(`[PlayersStore] Pontuação atualizada: ${player.name} -> ${score}`);
  }
}

// Socket.io eventos
io.on('connection', (socket: Socket) => {
  console.log(`[Conexão] Novo cliente conectado: ${socket.id}`);

  // Evento: Cliente identificando seu perfil (Host ou Player)
  socket.on('identify', (data: { profile: 'host' | 'player'; playerId?: string; playerName?: string }) => {
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
  });

  // Evento: Atualizar pontuação
  socket.on('updateScore', (data: { socketId?: string; score: number }) => {
    const targetId = data.socketId || socket.id;
    updatePlayerScore(targetId, data.score);
    io.emit('playersList', getAllPlayers());
  });

  // Evento: Listar jogadores
  socket.on('getPlayers', () => {
    socket.emit('playersList', getAllPlayers());
  });

  // Evento: Mensagem genérica
  socket.on('message', (data) => {
    console.log(`[Mensagem] De ${socket.id}:`, data);
    io.emit('message', {
      from: socket.id,
      data,
      timestamp: new Date().toISOString()
    });
  });

  // Evento: Get initial words
  socket.on('getInitialWords', (data: { limit: number; offset: number }) => {
    const limit = data?.limit || 20;
    const offset = data?.offset || 0;
    const paginatedWords = wordsData.words.slice(offset, offset + limit).map((w, i) => ({
      id: `word-${offset + i}`,
      text: w.word,
      meaning: w.meaning
    }));
    socket.emit('initialWords', {
      words: paginatedWords,
      hasMore: offset + limit < wordsData.words.length
    });
  });

  // Evento: Get word meaning by text
  socket.on('getWordMeaning', (data: { word: string }) => {
    const word = wordsData.words.find(w => w.word === data.word);
    if (word) {
      socket.emit('wordMeaning', { word: word.word, meaning: word.meaning });
    }
  });

  // Evento: Request 5 suggestions
  socket.on('requestSuggestions', (data: { count: number }) => {
    const count = data?.count || 5;
    const suggestions = getRandomWords(count).map((w, i) => ({
      id: `suggestion-${i}`,
      text: w.word,
      meaning: w.meaning
    }));
    socket.emit('wordSuggestions', suggestions);
  });

  // Evento: Search words
  socket.on('searchWords', (data: { query: string; limit: number; offset: number }) => {
    const query = (data?.query || '').toLowerCase().trim();
    const limit = data?.limit || 20;
    const offset = data?.offset || 0;
    
    const results = wordsData.words.filter(w => 
      w.word.toLowerCase().includes(query) || 
      w.meaning.toLowerCase().includes(query)
    );
    
    const paginatedResults = results.slice(offset, offset + limit).map((w, i) => ({
      id: `search-${offset + i}`,
      text: w.word,
      meaning: w.meaning
    }));
    
    socket.emit('wordSearchResults', {
      words: paginatedResults,
      hasMore: offset + limit < results.length
    });
  });

  // Evento: Iniciar jogo (host)
  socket.on('startGame', () => {
    const player = playersStore.get(socket.id);
    if (player && player.profile === 'host') {
      console.log(`[Jogo] Partida iniciada pelo host`);
      io.emit('gameStarted', { timestamp: new Date().toISOString() });
      io.to('player').emit('startLeaderSelection');
    }
  });

  // Evento: Iniciar rodada (leader seleciona palavra)
  socket.on('startRound', (data: { word: string; meaning: string }) => {
    const player = playersStore.get(socket.id);
    if (player) {
      console.log(`[Jogo] Rodada iniciada com palavra: ${data.word}`);
      io.emit('roundStarted', { 
        word: data.word, 
        meaning: data.meaning,
        leaderId: socket.id,
        leaderName: player.name,
        timestamp: new Date().toISOString() 
      });
    }
  });

  // Evento: Desconexão
  socket.on('disconnect', () => {
    console.log(`[Desconexão] Cliente desconectado: ${socket.id}`);
    removePlayer(socket.id);
    io.emit('playerLeft', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    io.emit('playersList', getAllPlayers());
  });

  // Evento: Tratamento de erro
  socket.on('error', (error) => {
    console.error(`[Erro] Socket ${socket.id}:`, error);
  });
});

// Iniciar servidor
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

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Shutdown] Encerrando servidor...');
  httpServer.close(() => {
    console.log('✓ Servidor encerrado');
    process.exit(0);
  });
});
