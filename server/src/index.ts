import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import os from 'os';

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

// API: Ver estado do playersStore
app.get('/api/players', (req, res) => {
  res.json({
    count: playersStore.size,
    players: getAllPlayers()
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
