import { Service, inject } from '@angular/core';
import { EmbeddingModel } from './embedding-model';

export interface SimilarityCandidate {
  id: string;
  text: string;
}

export interface SimilarityScore {
  id: string;
  score: number;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

@Service()
export class SemanticSimilarityService {
  private model = inject(EmbeddingModel);

  async rank(query: string, candidates: SimilarityCandidate[]): Promise<SimilarityScore[]> {
    if (!candidates.length) return [];

    const [queryVector, ...candidateVectors] = await this.model.embed([
      query,
      ...candidates.map((candidate) => candidate.text),
    ]);

    return candidates
      .map((candidate, index) => ({
        id: candidate.id,
        score: cosineSimilarity(queryVector, candidateVectors[index]),
      }))
      .sort((a, b) => b.score - a.score);
  }
}
