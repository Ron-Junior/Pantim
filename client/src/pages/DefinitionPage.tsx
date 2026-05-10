import { Component, createSignal, createEffect, Show } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import DefinitionInput from '@/components/DefinitionInput';
import LeaderWaiting from '@/components/LeaderWaiting';

const DefinitionPage: Component = () => {
  const [searchParams] = useSearchParams();
  const [currentWord, setCurrentWord] = createSignal<string>('');
  const [leaderName, setLeaderName] = createSignal<string>('');
  const [isLeader, setIsLeader] = createSignal(false);

  createEffect(() => {
    const wordParam = searchParams.word;
    const leaderParam = searchParams.leader;
    const isLeaderParam = searchParams.isLeader;

    if (wordParam && typeof wordParam === 'string') {
      setCurrentWord(wordParam);
    }
    if (leaderParam && typeof leaderParam === 'string') {
      setLeaderName(leaderParam);
    }
    setIsLeader(isLeaderParam === 'true');
  });

  return (
    <Show
      when={currentWord()}
      fallback={
        <div class="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 flex items-center justify-center p-6">
          <div class="text-center">
            <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p class="text-slate-400 text-lg">Aguardando palavra da rodada...</p>
          </div>
        </div>
      }
    >
      <Show
        when={isLeader()}
        fallback={
          <DefinitionInput
            word={currentWord()}
            leaderName={leaderName()}
          />
        }
      >
        <LeaderWaiting word={currentWord()} leaderName={leaderName()} />
      </Show>
    </Show>
  );
};

export default DefinitionPage;
