import { Component, createSignal } from 'solid-js';
import { io } from 'socket.io-client';
import { getServerConfig } from '@/lib/server';
import { UserProfile } from '../../shared/types';

interface JoinGamePayload {
  profile: UserProfile;
  playerName: string;
}

const PlayerLoginPage: Component = () => {
  const [playerName, setPlayerName] = createSignal('');
  const [isConnecting, setIsConnecting] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const handleJoinGame = async (e: Event) => {
    e.preventDefault();
    
    const name = playerName().trim();
    if (!name) {
      setError('Por favor, insira seu nome');
      return;
    }

    if (name.length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return;
    }

    if (name.length > 20) {
      setError('Nome deve ter no máximo 20 caracteres');
      return;
    }

    setIsConnecting(true);
    setError(null);

    const config = getServerConfig();
    const socket = io(`${config.host}:${config.port}`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      const payload: JoinGamePayload = {
        profile: 'player',
        playerName: name,
      };
      socket.emit('identify', payload);
      console.log('Player joining game:', name);
    });

    socket.on('connect_error', () => {
      setError('Não foi possível conectar ao servidor');
      setIsConnecting(false);
    });
  };

  return (
    <div class="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 flex flex-col items-center justify-center p-6">
      <div class="w-full max-w-md">
        <div class="text-center mb-12">
          <h1 class="text-5xl font-display font-bold text-white mb-3">
            PANTIM
          </h1>
          <p class="text-lg text-slate-400">
            Digite seu nome para entrar no jogo
          </p>
        </div>

        <form onSubmit={handleJoinGame} class="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Seu nome"
              value={playerName()}
              onInput={(e) => setPlayerName(e.currentTarget.value)}
              disabled={isConnecting()}
              class="w-full px-6 py-4 bg-dark-700 border-2 border-dark-600 rounded-2xl text-white text-xl text-center placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
              maxLength={20}
              autofocus
            />
          </div>

          {error() && (
            <div class="text-center">
              <p class="text-red-400 text-sm">{error()}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isConnecting()}
            class="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-bold text-xl rounded-2xl transition-colors shadow-lg shadow-primary-500/30"
          >
            {isConnecting() ? 'Entrando...' : 'Entrar no Jogo'}
          </button>
        </form>

        <p class="text-center text-slate-500 text-sm mt-8">
          Aguardando confirmação do anfitrião...
        </p>
      </div>
    </div>
  );
};

export default PlayerLoginPage;