import { Component, createSignal, createEffect, onCleanup, For, Show, on } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { io, Socket } from 'socket.io-client';
import { getServerConfig } from '@/lib/server';
import { showToast } from '@/components/Toast';

interface Word {
  id: string;
  text: string;
  meaning?: string;
}

const LeaderSelectionPage: Component = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = createSignal<Socket | null>(null);
  const [words, setWords] = createSignal<Word[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = createSignal(false);
  const [isLoadingSearch, setIsLoadingSearch] = createSignal(false);
  const [isLoadingMore, setIsLoadingMore] = createSignal(false);
  const [hasMore, setHasMore] = createSignal(true);
  const [page, setPage] = createSignal(1);
  const [selectedWord, setSelectedWord] = createSignal<Word | null>(null);
  const [isSearching, setIsSearching] = createSignal(false);
  const [isStartingRound, setIsStartingRound] = createSignal(false);

  const WORDS_PER_PAGE = 20;
  const PAGE_SIZE = 20;

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let listContainerRef: HTMLDivElement | undefined;

  const performSearch = (query: string) => {
    const s = socket();
    if (!s) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      if (isSearching()) {
        setIsSearching(false);
        setPage(1);
        setHasMore(true);
        loadInitialWords();
      }
      return;
    }

    setIsSearching(true);
    setIsLoadingSearch(true);
    setPage(1);
    s.emit('searchWords', { query: trimmed, limit: PAGE_SIZE, offset: 0 });
  };

  createEffect(on(searchQuery, (query) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 300);
  }));

  createEffect(() => {
    const config = getServerConfig();
    const newSocket = io(`${config.host}:${config.port}`, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('LeaderSelection: Connected to server');
      loadInitialWords();
    });

    newSocket.on('wordSuggestions', (suggestions: Word[]) => {
      setWords(suggestions);
      setIsLoadingSuggestions(false);
      showToast('5 palavras sugeridas carregadas!', 'success');
    });

    newSocket.on('wordSearchResults', (data: { words: Word[]; hasMore: boolean }) => {
      if (page() === 1) {
        setWords(data.words);
      } else {
        setWords((prev) => [...prev, ...data.words]);
      }
      setHasMore(data.hasMore);
      setIsLoadingSearch(false);
      setIsLoadingMore(false);
    });

    newSocket.on('initialWords', (data: { words: Word[]; hasMore: boolean }) => {
      console.log('initialWords received:', data.words.length, 'hasMore:', data.hasMore);
      if (page() === 1) {
        setWords(data.words);
      } else {
        setWords((prev) => [...prev, ...data.words]);
      }
      setHasMore(data.hasMore);
      setIsLoadingMore(false);
    });

    newSocket.on('roundStarted', (data: { word: string; meaning: string; leaderId: string; leaderName: string }) => {
      console.log('roundStarted received:', data);
      showToast(`Rodada iniciada! Palavra: ${data.word}`, 'success');
      navigate(`/definition?word=${encodeURIComponent(data.word)}&leader=${encodeURIComponent(data.leaderName)}&isLeader=true`);
    });

    newSocket.on('START_WRITING', (data: { word: string; leaderName: string }) => {
      showToast(`Rodada iniciada! Palavra: ${data.word}`, 'success');
    });

    newSocket.on('gameEnded', () => {
      showToast('Partida finalizada pelo host!', 'info');
      navigate('/');
    });

    newSocket.on('error', (error: string) => {
      showToast(error, 'error');
      setIsLoadingSuggestions(false);
      setIsLoadingSearch(false);
      setIsLoadingMore(false);
    });

    setSocket(newSocket);

    onCleanup(() => {
      newSocket.disconnect();
      clearTimeout(debounceTimer);
    });
  });

  const loadInitialWords = () => {
    console.log('loadInitialWords called');
    const s = socket();
    if (s) {
      s.emit('getInitialWords', { limit: WORDS_PER_PAGE, offset: 0 });
    }
  };

  const requestSuggestions = () => {
    const s = socket();
    if (s && !isLoadingSuggestions()) {
      setIsLoadingSuggestions(true);
      setIsSearching(false);
      setPage(1);
      setSearchQuery('');
      s.emit('requestSuggestions', { count: 5 });
    }
  };

  const handleWordClick = (word: Word) => {
    setSelectedWord(word);
    showToast(`Palavra "${word.text}" selecionada!`, 'success');
  };

  const startRound = () => {
    const word = selectedWord();
    const s = socket();
    if (!s || !word) return;

    setIsStartingRound(true);
    s.emit('startRound', { word: word.text, meaning: word.meaning || '' });
  };

  const loadMore = () => {
    console.log('loadMore called, page:', page(), 'hasMore:', hasMore(), 'isLoadingMore:', isLoadingMore());
    if (isLoadingMore() || !hasMore()) return;

    const s = socket();
    if (!s) return;

    setIsLoadingMore(true);
    const nextPage = page() + 1;
    setPage(nextPage);

    if (isSearching()) {
      s.emit('searchWords', {
        query: searchQuery().trim(),
        limit: PAGE_SIZE,
        offset: (nextPage - 1) * PAGE_SIZE,
      });
    } else {
      s.emit('getInitialWords', {
        limit: PAGE_SIZE,
        offset: (nextPage - 1) * PAGE_SIZE,
      });
    }
  };

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    console.log('Scroll:', scrollTop + clientHeight, '>=', scrollHeight - 50);
    
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      loadMore();
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 flex flex-col items-center p-6">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-display font-bold text-white mb-2">
            Escolha a Palavra
          </h1>
          <p class="text-lg text-slate-400">
            Você é o líder desta rodada
          </p>
          <p class="text-sm text-slate-500 mt-2">
            Total: {words().length} | hasMore: {hasMore() ? 'sim' : 'não'}
          </p>
        </div>

        <div class="space-y-4 mb-6">
          <button
            onClick={requestSuggestions}
            disabled={isLoadingSuggestions()}
            class="w-full py-4 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-500/50 text-white font-bold text-lg rounded-2xl transition-colors shadow-lg shadow-accent-500/30 flex items-center justify-center gap-2"
          >
            <Show when={isLoadingSuggestions()} fallback={
              <>
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Pedir 5 Sugestões
              </>
            }>
              <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Carregando...
            </Show>
          </button>

          <div class="relative">
            <input
              type="text"
              placeholder="Digite para buscar..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full px-4 py-3 bg-dark-700 border-2 border-dark-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
            <Show when={isLoadingSearch()}>
              <div class="absolute right-4 top-1/2 -translate-y-1/2">
                <div class="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              </div>
            </Show>
          </div>
        </div>

        <div 
          ref={listContainerRef}
          onScroll={handleScroll}
          class="bg-dark-700/50 rounded-2xl p-4 max-h-[400px] overflow-y-auto custom-scrollbar"
        >
          <Show when={words().length === 0 && !isLoadingSearch() && !isLoadingSuggestions()}>
            <div class="text-center py-8">
              <p class="text-slate-400">Nenhuma palavra encontrada</p>
              <p class="text-slate-500 text-sm mt-2">
                Use o campo acima para buscar ou peça sugestões
              </p>
            </div>
          </Show>

          <div class="space-y-2">
            <For each={words()}>
              {(word) => (
                <button
                  onClick={() => handleWordClick(word)}
                  class={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedWord()?.id === word.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-600 hover:bg-dark-500 text-white'
                  }`}
                >
                  <span class="font-medium text-lg">{word.text}</span>
                </button>
              )}
            </For>
          </div>

          <Show when={hasMore() && words().length > 0}>
            <div class="h-20 flex items-center justify-center border-t border-dark-600 mt-4">
              <Show when={isLoadingMore()} fallback={
                <p class="text-slate-500 text-sm">↓ Fim da lista</p>
              }>
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span class="text-slate-400">Carregando...</span>
                </div>
              </Show>
            </div>
          </Show>
        </div>

        <Show when={selectedWord()}>
          <div class="mt-6 p-4 bg-primary-500/20 border border-primary-500 rounded-2xl">
            <p class="text-primary-300 text-center font-semibold text-lg">
              Palavra selecionada: {selectedWord()?.text}
            </p>
            <Show when={selectedWord()?.meaning}>
              <div class="mt-3 p-3 bg-dark-700/50 rounded-xl">
                <p class="text-slate-300 text-sm">
                  <span class="text-primary-400 font-semibold">Significado:</span> {selectedWord()?.meaning}
                </p>
              </div>
            </Show>
            <button
              onClick={startRound}
              disabled={isStartingRound()}
              class="mt-4 w-full py-3 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-500/50 text-white font-bold text-lg rounded-xl transition-colors shadow-lg shadow-accent-500/30 flex items-center justify-center gap-2"
            >
              <Show when={isStartingRound()} fallback={
                <>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Iniciar Rodada
                </>
              }>
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Iniciando...
              </Show>
            </button>
          </div>
        </Show>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
};

export default LeaderSelectionPage;