import { Component, createSignal, onMount, onCleanup, createEffect, For, Show } from 'solid-js';
import { generateQRCodeDataURL, getPlayerJoinURL } from '@/lib/qrcode';
import { getServerInfo } from '@/lib/server';
import { io, Socket } from 'socket.io-client';
import { showToast } from '@/components/Toast';

interface Player {
  id: string;
  name: string;
}

const QRCodePage: Component = () => {
  const [qrCodeDataURL, setQRCodeDataURL] = createSignal<string>('');
  const [serverIP, setServerIP] = createSignal<string>('');
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [connectedPlayers, setConnectedPlayers] = createSignal<Player[]>([]);
  const [socket, setSocket] = createSignal<Socket | null>(null);
  const [isStarting, setIsStarting] = createSignal(false);

  let socketRef: Socket | null = null;

  onMount(async () => {
    const serverInfo = await getServerInfo();
    setServerIP(serverInfo.ip);

    try {
      const joinURL = getPlayerJoinURL(serverInfo.ip);
      const dataURL = await generateQRCodeDataURL(joinURL);
      setQRCodeDataURL(dataURL);
      setIsLoading(false);
    } catch (err) {
      setError('Falha ao gerar QR Code');
      setIsLoading(false);
    }

    socketRef = io(`${window.location.protocol}//${serverInfo.ip}:3000`, {
      transports: ['websocket', 'polling'],
    });

    socketRef.on('connect', () => {
      socketRef!.emit('identify', { profile: 'host' });
      showToast('Servidor conectado!', 'success');
    });

    socketRef.on('playerJoined', (data: { socketId: string; playerName: string; profile: string }) => {
      if (data.profile === 'player') {
        setConnectedPlayers((prev) => [...prev, { id: data.socketId, name: data.playerName }]);
      }
    });

    socketRef.on('playerLeft', (data: { socketId: string }) => {
      setConnectedPlayers((prev) => prev.filter((p) => p.id !== data.socketId));
    });

    socketRef.on('gameStarted', () => {
      showToast('Jogo iniciado!', 'success');
      setIsStarting(false);
    });

    setSocket(socketRef);
  });

  onCleanup(() => {
    if (socketRef) {
      socketRef.disconnect();
    }
  });

  const handleStartGame = () => {
    const s = socket();
    if (!s || isStarting()) return;

    if (connectedPlayers().length === 0) {
      showToast('Aguarde pelo menos 1 jogador', 'error');
      return;
    }

    setIsStarting(true);
    s.emit('startGame');
  };

  return (
    <div class="min-h-screen p-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-6xl font-display font-bold text-white mb-4">
            PANTIM
          </h1>
          <p class="text-xl text-slate-400">
            Escaneie o QR Code para participar
          </p>
        </div>

        <div class="flex flex-col lg:flex-row gap-8 items-start justify-center">
          <div class="flex-shrink-0">
            <div class="bg-white rounded-3xl shadow-2xl p-8">
              <Show when={isLoading()}>
                <div class="w-[300px] h-[300px] flex items-center justify-center">
                  <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              </Show>

              <Show when={error()}>
                <div class="w-[300px] h-[300px] flex items-center justify-center">
                  <p class="text-red-500 text-xl">{error()}</p>
                </div>
              </Show>

              <Show when={!isLoading() && !error() && qrCodeDataURL()}>
                <img
                  src={qrCodeDataURL()}
                  alt="QR Code para jogadores"
                  class="w-[300px] h-[300px] rounded-2xl"
                />
              </Show>
            </div>

            <div class="text-center mt-6">
              <p class="text-2xl font-mono text-accent-400 mb-2">
                {serverIP()}:3001
              </p>
            </div>
          </div>

          <div class="flex-1 max-w-md w-full">
            <div class="bg-dark-700/50 rounded-2xl p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-white">
                  Jogadores ({connectedPlayers().length})
                </h2>
                <div class={`w-3 h-3 rounded-full ${connectedPlayers().length > 0 ? 'bg-green-500' : 'bg-slate-500'}`} />
              </div>

              <div class="space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto mb-6">
                <Show when={connectedPlayers().length === 0}>
                  <div class="text-center py-8 text-slate-500">
                    <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>Aguardando jogadores...</p>
                    <p class="text-sm mt-1">Escaneie o QR Code para adicionar</p>
                  </div>
                </Show>

                <For each={connectedPlayers()}>
                  {(player) => (
                    <div class="flex items-center gap-3 p-3 bg-dark-600 rounded-xl">
                      <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                        <span class="text-lg font-bold text-white">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div class="flex-1">
                        <p class="text-white font-medium">{player.name}</p>
                        <p class="text-slate-500 text-xs">{player.id.slice(0, 8)}</p>
                      </div>
                      <div class="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  )}
                </For>
              </div>

              <button
                onClick={handleStartGame}
                disabled={isStarting() || connectedPlayers().length === 0}
                class="w-full py-4 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-500/50 disabled:cursor-not-allowed text-white font-bold text-xl rounded-2xl transition-all shadow-lg shadow-accent-500/30 flex items-center justify-center gap-2"
              >
                <Show when={isStarting()} fallback={
                  <>
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Iniciar Partida
                  </>
                }>
                  <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Iniciando...
                </Show>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
