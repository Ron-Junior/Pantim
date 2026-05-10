import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import {
  findWordById,
  getRandomWords,
  searchWords,
  getAllWords
} from '../services/word.service';

export function handleGetInitialWords(
  io: SocketIOServer,
  socket: Socket,
  data: { limit: number; offset: number }
): void {
  const limit = data?.limit || 20;
  const offset = data?.offset || 0;
  const allWords = getAllWords();

  const paginatedWords = allWords.slice(offset, offset + limit).map((w, i) => ({
    id: `word-${offset + i}`,
    text: w.word,
    meaning: w.meaning
  }));

  socket.emit('initialWords', {
    words: paginatedWords,
    hasMore: offset + limit < allWords.length
  });
}

export function handleGetWordMeaning(
  io: SocketIOServer,
  socket: Socket,
  data: { word: string }
): void {
  const word = findWordById(data.word);
  if (word) {
    socket.emit('wordMeaning', { word: word.word, meaning: word.meaning });
  }
}

export function handleRequestSuggestions(
  io: SocketIOServer,
  socket: Socket,
  data: { count: number }
): void {
  const count = data?.count || 5;
  const suggestions = getRandomWords(count).map((w, i) => ({
    id: `suggestion-${i}`,
    text: w.word,
    meaning: w.meaning
  }));

  socket.emit('wordSuggestions', suggestions);
}

export function handleSearchWords(
  io: SocketIOServer,
  socket: Socket,
  data: { query: string; limit: number; offset: number }
): void {
  const { results, hasMore } = searchWords(
    data.query,
    data.limit || 20,
    data.offset || 0
  );

  const paginatedResults = results.map((w, i) => ({
    id: `search-${i}`,
    text: w.word,
    meaning: w.meaning
  }));

  socket.emit('wordSearchResults', {
    words: paginatedResults,
    hasMore
  });
}
