import { JobAnalysis } from '../../../../jobs/models/job-analysis';
import { CareerProfile } from '../../../../profile/models/career-profile';
import { CareerFact } from '../../../models/career-fact';

const REQUIRED_WEIGHT = 3;
const PREFERRED_WEIGHT = 2;
const TECHNOLOGY_WEIGHT = 2;
const DOMAIN_WEIGHT = 2;
const KEYWORD_WEIGHT = 1;
const PROFILE_WEIGHT = 1.5;

function tokenise(...values: string[]): Set<string> {
  const tokens = new Set<string>();
  for (const value of values) {
    for (const token of value
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter(Boolean)) {
      tokens.add(token);
    }
  }
  return tokens;
}

function overlapScore(factTokens: Set<string>, terms: string[], weight: number): number {
  let score = 0;
  for (const term of terms) {
    const termTokens = Array.from(tokenise(term));
    if (termTokens.length && termTokens.every((token) => factTokens.has(token))) {
      score += weight;
    }
  }
  return score;
}

/**
 * Deterministic relevance score for one career fact against a job analysis.
 * Exact token overlap only — no LLM, no embeddings. Phase 8: reduce how much
 * reasoning the model is responsible for before it ever sees a prompt.
 */
export function scoreFact(
  fact: CareerFact,
  analysis: JobAnalysis,
  profile?: CareerProfile,
): number {
  const factTokens = tokenise(
    fact.text,
    fact.meta['skills'] ?? '',
    fact.meta['domains'] ?? '',
    fact.meta['technologies'] ?? '',
    fact.meta['name'] ?? '',
  );

  let score = 0;
  score += overlapScore(factTokens, analysis.requiredSkills, REQUIRED_WEIGHT);
  score += overlapScore(factTokens, analysis.preferredSkills, PREFERRED_WEIGHT);
  score += overlapScore(factTokens, analysis.technologies, TECHNOLOGY_WEIGHT);
  score += overlapScore(factTokens, analysis.domains, DOMAIN_WEIGHT);
  score += overlapScore(factTokens, analysis.keywords, KEYWORD_WEIGHT);

  if (profile?.domains?.length) {
    score += overlapScore(factTokens, profile.domains, PROFILE_WEIGHT);
  }

  return score;
}
