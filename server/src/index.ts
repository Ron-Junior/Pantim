import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import os from 'os';

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

function getLocalIPv4() {
    const networkInterfaces = os.networkInterfaces();

    for (const interfaceName in networkInterfaces) {
        const networkInterface = networkInterfaces[interfaceName];

        if (networkInterface) {
            for (const net of networkInterface) {
                if (net.family === 'IPv4' && !net.internal) {
                    return net.address;
                }
            }
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

// Socket.io eventos
io.on('connection', (socket) => {
  console.log(`[Conexão] Novo cliente conectado: ${socket.id}`);

  // Evento: Cliente identificando seu perfil (Host ou Player)
  socket.on('identify', (data: { profile: 'host' | 'player'; playerId?: string }) => {
    console.log(`[Identificação] ${socket.id} - Perfil: ${data.profile}`);
    socket.join(data.profile);
    
    io.emit('playerJoined', {
      socketId: socket.id,
      profile: data.profile,
      timestamp: new Date().toISOString()
    });
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
    io.emit('playerLeft', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
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
