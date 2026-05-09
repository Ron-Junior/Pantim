import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Aceita conexões de qualquer interface de rede (LAN)

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
