import { Component, createSignal, createEffect, onCleanup, Show } from 'solid-js';
import { io, Socket } from 'socket.io-client';
import { getServerConfig } from '@/lib/server';
import { showToast } from '@/components/Toast';

interface DefinitionInputProps {
  word: string;
  leaderName: string;
  onSubmitted?: () => void;
}

const DefinitionInput: Component<DefinitionInputProps> = (props) => {
  const [socket, setSocket] = createSignal<Socket | null>(null);
  const [definition, setDefinition] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [isSubmitted, setIsSubmitted] = createSignal(false);

  createEffect(() => {
    const config = getServerConfig();
    const newSocket = io(`${config.host}:${config.port}`, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('DefinitionInput: Connected to server');
    });

    newSocket.on('definitionSubmitted', () => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      showToast('Definição enviada com sucesso!', 'success');
      props.onSubmitted?.();
    });

    newSocket.on('error', (error: string) => {
      showToast(error, 'error');
      setIsSubmitting(false);
    });

    setSocket(newSocket);

    onCleanup(() => {
      newSocket.disconnect();
    });
  });

  const handleSubmit = () => {
    const s = socket();
    if (!s || !definition().trim()) return;

    setIsSubmitting(true);
    s.emit('SUBMIT_DEFINITION', {
      definition: definition().trim(),
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div class="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 flex flex-col">
      <div class="flex-1 flex flex-col items-center justify-center p-6 pb-24">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-display font-bold text-white mb-2">
              Crie sua Definição
            </h1>
            <p class="text-slate-400">
              O líder escolheu a palavra. Seja criativo!
            </p>
          </div>

          <div class="bg-dark-700/50 rounded-2xl p-6 mb-6">
            <p class="text-center text-slate-400 text-sm mb-2">A palavra secreta é:</p>
            <div class="bg-dark-600 rounded-xl p-4 text-center">
              <p class="text-4xl font-display font-bold text-primary-400">
                {props.word}
              </p>
            </div>
          </div>

          <Show
            when={!isSubmitted()}
            fallback={
              <div class="bg-dark-700/50 rounded-2xl p-8 text-center">
                <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 class="text-xl font-bold text-white mb-2">Enviado!</h2>
                <p class="text-slate-400">
                  Aguardando outros jogadores...
                </p>
              </div>
            }
          >
            <div class="mb-6">
              <textarea
                value={definition()}
                onInput={(e) => setDefinition(e.currentTarget.value)}
                placeholder="Invente algo convincente que defina a palavra..."
                rows={4}
                disabled={isSubmitting()}
                class="w-full px-4 py-4 bg-dark-700 border-2 border-dark-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors resize-none text-lg"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!definition().trim() || isSubmitting()}
              class="w-full py-4 bg-accent-500 hover:bg-accent-600 disabled:bg-dark-600 disabled:text-slate-500 text-white font-bold text-lg rounded-2xl transition-colors shadow-lg shadow-accent-500/30 flex items-center justify-center gap-2"
            >
              <Show
                when={isSubmitting()}
                fallback={
                  <>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviar
                  </>
                }
              >
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </Show>
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default DefinitionInput;
