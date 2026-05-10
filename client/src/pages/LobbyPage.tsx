import { Component, createSignal, onCleanup, createEffect } from 'solid-js';
import { useNavigate, useSearchParams } from '@solidjs/router';
import { io, Socket } from 'socket.io-client';
import { getServerConfig } from '@/lib/server';
import { showToast } from '@/components/Toast';

interface Player {
  id: string;
  name: string;
}

const LobbyPage: Component = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [socket, setSocket] = createSignal<Socket | null>(null);
  const [connectedPlayers, setConnectedPlayers] = createSignal<Player[]>([]);
  const [isInGame, setIsInGame] = createSignal(false);

  const playerName = searchParams.name || '';

  createEffect(() => {
    if (!playerName) {
      navigate('/player');
      return;
    }

    const config = getServerConfig();
    const newSocket = io(`${config.host}:${config.port}`, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('identify', { profile: 'player', playerName });
      showToast(`Bem-vindo, ${playerName}!`, 'success');
    });

    newSocket.on('playersList', (players: Player[]) => {
      setConnectedPlayers(players);
    });

    newSocket.on('gameStarted', () => {
      setIsInGame(true);
    });

    newSocket.on('startLeaderSelection', () => {
      navigate('/leader');
    });

    newSocket.on('connect_error', () => {
      showToast('Conexão perdida', 'error');
    });

    setSocket(newSocket);

    onCleanup(() => {
      newSocket.disconnect();
    });
  });

  return (
    <div class="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 flex flex-col items-center p-6">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-display font-bold text-white mb-3">
            PANTIM
          </h1>
          <p class="text-lg text-slate-400">
            Aguardando início do jogo...
          </p>
        </div>

        <div class="bg-dark-700/50 rounded-2xl p-6 mb-6">
          <h2 class="text-xl font-semibold text-white mb-2">Sua conta</h2>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
              <span class="text-2xl font-bold text-white">
                {playerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p class="text-white font-semibold text-lg">{playerName}</p>
              <p class="text-slate-400 text-sm">Conectado</p>
            </div>
          </div>
        </div>

        <div class="bg-dark-700/50 rounded-2xl p-6">
          <h2 class="text-xl font-semibold text-white mb-4">
            Jogadores conectados ({connectedPlayers().length})
          </h2>
          <div class="space-y-2 max-h-60 overflow-y-auto">
            {connectedPlayers().map((player) => (
              <div class="flex items-center gap-3 p-3 bg-dark-600 rounded-xl">
                <div class="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center">
                  <span class="text-sm font-bold text-white">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span class="text-white">{player.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div class="mt-8 flex items-center justify-center">
          <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span class="ml-3 text-slate-400">Aguardando jogadores...</span>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
