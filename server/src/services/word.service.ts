import fs from 'fs';
import path from 'path';
import { Word, WordsData } from '../types/game.types';

let wordsData: WordsData = { words: [] };

export function loadWords(): void {
  try {
    const filePath = path.join(process.cwd(), 'src', 'words.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    wordsData = JSON.parse(fileContent);
    console.log(`[Words] Carregadas ${wordsData.words.length} palavras`);
  } catch (error) {
    console.error('[Words] Erro ao carregar palavras:', error);
    wordsData = { words: [] };
  }
}

export function getAllWords(): Word[] {
  return wordsData.words;
}

export function getWordCount(): number {
  return wordsData.words.length;
}

export function getRandomWords(count: number): Word[] {
  const shuffled = [...wordsData.words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function findWordById(wordId: string): Word | undefined {
  const index = parseInt(wordId.replace('word-', ''));
  if (!isNaN(index) && index >= 0 && index < wordsData.words.length) {
    return wordsData.words[index];
  }
  return wordsData.words.find(
    (w) => w.word.toLowerCase() === wordId.toLowerCase()
  );
}

export function findWordByText(wordText: string): Word | undefined {
  return wordsData.words.find(
    (w) => w.word.toLowerCase() === wordText.toLowerCase()
  );
}

export function searchWords(
  query: string,
  limit: number = 20,
  offset: number = 0
): { results: Word[]; hasMore: boolean } {
  const lowerQuery = query.toLowerCase().trim();
  const results = wordsData.words.filter(
    (w) =>
      w.word.toLowerCase().includes(lowerQuery) ||
      w.meaning.toLowerCase().includes(lowerQuery)
  );

  return {
    results: results.slice(offset, offset + limit),
    hasMore: offset + limit < results.length
  };
}
