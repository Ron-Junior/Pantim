import { Component } from 'solid-js';

interface LeaderWaitingProps {
  word: string;
  leaderName: string;
}

const LeaderWaiting: Component<LeaderWaitingProps> = (props) => {
  return (
    <div class="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 flex flex-col">
      <div class="flex-1 flex flex-col items-center justify-center p-6 pb-24">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-display font-bold text-white mb-2">
              Aguarde
            </h1>
            <p class="text-slate-400">
              Você é o líder desta rodada
            </p>
          </div>

          <div class="bg-dark-700/50 rounded-2xl p-6 mb-6">
            <p class="text-center text-slate-400 text-sm mb-2">Sua palavra é:</p>
            <div class="bg-dark-600 rounded-xl p-4 text-center">
              <p class="text-4xl font-display font-bold text-primary-400">
                {props.word}
              </p>
            </div>
          </div>

          <div class="bg-dark-700/50 rounded-2xl p-8 text-center">
            <div class="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 class="text-xl font-bold text-white mb-2">Aguardando...</h2>
            <p class="text-slate-400">
              Os jogadores estão inventando definições para a sua palavra...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderWaiting;
