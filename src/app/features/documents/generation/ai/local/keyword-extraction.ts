import { Service, inject } from '@angular/core';
import { EmbeddingModel } from './embedding-model';
import { cosineSimilarity } from './semantic-similarity';

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'if',
  'then',
  'than',
  'so',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'without',
  'by',
  'from',
  'as',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'we',
  'you',
  'they',
  'their',
  'our',
  'your',
  'will',
  'would',
  'should',
  'can',
  'could',
  'may',
  'might',
  'must',
  'shall',
  'do',
  'does',
  'did',
  'have',
  'has',
  'had',
  'not',
  'no',
  'yes',
  'about',
  'into',
  'through',
  'per',
  'etc',
  'e.g',
  'i.e',
  'us',
  'who',
  'what',
  'when',
  'where',
  'why',
  'how',
  'all',
  'any',
  'each',
  'other',
  'some',
  'such',
]);

const MAX_CANDIDATES = 60;
const DEFAULT_TOP_N = 12;
const DIVERSITY_THRESHOLD = 0.85;

@Service()
export class KeywordExtractor {
  private model = inject(EmbeddingModel);

  async extract(text: string, topN = DEFAULT_TOP_N): Promise<string[]> {
    const candidates = this.candidatePhrases(text);
    if (!candidates.length) return [];

    const [docVector, ...candidateVectors] = await this.model.embed([text, ...candidates]);

    const ranked = candidates
      .map((phrase, index) => ({
        phrase,
        vector: candidateVectors[index],
        score: cosineSimilarity(docVector, candidateVectors[index]),
      }))
      .sort((a, b) => b.score - a.score);

    const selected: typeof ranked = [];
    for (const candidate of ranked) {
      const tooSimilar = selected.some(
        (chosen) => cosineSimilarity(chosen.vector, candidate.vector) > DIVERSITY_THRESHOLD,
      );
      if (!tooSimilar) selected.push(candidate);
      if (selected.length >= topN) break;
    }

    return selected.map((candidate) => candidate.phrase);
  }

  private candidatePhrases(text: string): string[] {
    const words = text
      .replace(/[^\p{L}\p{N}+.#\s-]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const phrases = new Set<string>();

    for (let size = 1; size <= 3 && phrases.size < MAX_CANDIDATES; size++) {
      for (let i = 0; i + size <= words.length; i++) {
        const slice = words.slice(i, i + size);
        if (slice.some((word) => STOPWORDS.has(word.toLowerCase()))) continue;
        if (slice.some((word) => word.length < 2)) continue;

        const phrase = slice.join(' ');
        if (phrase.length < 3 || phrase.length > 40) continue;

        phrases.add(phrase);
      }
    }

    return Array.from(phrases).slice(0, MAX_CANDIDATES);
  }
}
