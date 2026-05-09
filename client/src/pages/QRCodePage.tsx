import { Component, createSignal, onMount, Show } from 'solid-js';
import { generateQRCodeDataURL, getPlayerJoinURL } from '@/lib/qrcode';
import { getServerConfig } from '@/lib/server';
import { io, Socket } from 'socket.io-client';

const QRCodePage: Component = () => {
  const [qrCodeDataURL, setQRCodeDataURL] = createSignal<string>('');
  const [serverIP, setServerIP] = createSignal<string>('');
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [connectedPlayers, setConnectedPlayers] = createSignal<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let socket: Socket | null = null;

  onMount(async () => {
    const config = getServerConfig();
    const ip = config.host.replace('http://', '').replace('https://', '');
    setServerIP(ip);

    try {
      const joinURL = getPlayerJoinURL(ip, config.port);
      const dataURL = await generateQRCodeDataURL(joinURL);
      setQRCodeDataURL(dataURL);
      setIsLoading(false);
    } catch (err) {
      setError('Falha ao gerar QR Code');
      setIsLoading(false);
    }

    const newSocket = io(`${config.host}:${config.port}`, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Host connected:', newSocket.id);
      newSocket.emit('identify', { profile: 'host' });
    });

    newSocket.on('playerJoined', (data: { socketId: string; profile: string }) => {
      if (data.profile === 'player') {
        setConnectedPlayers((prev) => [...prev, data.socketId]);
      }
    });

    newSocket.on('playerLeft', (data: { socketId: string }) => {
      setConnectedPlayers((prev) => prev.filter((id) => id !== data.socketId));
    });

    socket = newSocket;
  });

  return (
    <div class="min-h-screen flex flex-col items-center justify-center p-8">
      <div class="text-center mb-12">
        <h1 class="text-6xl font-display font-bold text-white mb-4">
          PANTIM
        </h1>
        <p class="text-xl text-slate-400">
          Escaneie o QR Code para participar
        </p>
      </div>

      <div class="bg-white rounded-3xl shadow-2xl p-8 mb-8">
        <Show when={isLoading()}>
          <div class="w-[400px] h-[400px] flex items-center justify-center">
            <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </Show>

        <Show when={error()}>
          <div class="w-[400px] h-[400px] flex items-center justify-center">
            <p class="text-red-500 text-xl">{error()}</p>
          </div>
        </Show>

        <Show when={!isLoading() && !error() && qrCodeDataURL()}>
          <img
            src={qrCodeDataURL()}
            alt="QR Code para jogadores"
            class="w-[400px] h-[400px] rounded-2xl"
          />
        </Show>
      </div>

      <div class="text-center">
        <p class="text-3xl font-mono text-accent-400 mb-2">
          {serverIP()}:{getServerConfig().port}
        </p>
        <p class="text-slate-500 text-sm">
          {connectedPlayers().length} jogador(es) conectado(s)
        </p>
      </div>

      <div class="mt-12 flex gap-4">
        <Show when={connectedPlayers().length > 0}>
          <div class="flex flex-wrap justify-center gap-2">
            {connectedPlayers().map((playerId) => (
              <div class="px-4 py-2 bg-primary-500/20 border border-primary-500 rounded-full text-primary-300 text-sm">
                Jogador {playerId.slice(0, 6)}
              </div>
            ))}
          </div>
        </Show>
      </div>
    </div>
  );
};

export default QRCodePage;
