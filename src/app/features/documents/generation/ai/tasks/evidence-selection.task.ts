import { JobAnalysis } from '../../../../jobs/models/job-analysis';
import { Career } from '../../../../profile/models/career';
import { CareerProfile } from '../../../../profile/models/career-profile';
import { CareerFact } from '../../../models/career-fact';
import { EvidenceSelection } from '../../../models/evidence-selection';
import { buildCareerFacts, summariseProfile } from '../career-context';
import { SemanticSimilarityService } from '../local/semantic-similarity';
import { scoreFact } from '../local/skill-matching';
import { DATA_BOUNDARY, FACTUAL_RULES, MAX_SELECTED_FACTS } from '../prompts/shared';
import { evidenceSelectionSchema } from '../schemas/ai-schemas';
import { AiRun } from './ai-task';

const TIE_MARGIN = 0.5;
const SEMANTIC_WEIGHT = 3;

export async function selectEvidenceTask(
  run: AiRun,
  analysis: JobAnalysis,
  career: Career,
  profile?: CareerProfile,
  similarity?: SemanticSimilarityService,
): Promise<{ selection: EvidenceSelection; facts: CareerFact[] }> {
  const facts = buildCareerFacts(career);

  if (!facts.length) {
    throw new Error('Add some career information before generating a CV.');
  }

  const selection =
    (await selectDeterministically(facts, analysis, profile, similarity)) ??
    (await selectViaLlm(run, analysis, career, profile, facts));

  if (!selection.selectedFactIds.length) {
    throw new Error('The model did not select any usable career evidence. Please try again.');
  }

  return { selection, facts };
}

export function pickSelectedFacts(facts: CareerFact[], selection: EvidenceSelection): CareerFact[] {
  const selectedIds = new Set(selection.selectedFactIds);

  return facts.filter(
    (fact) => selectedIds.has(fact.id) || (fact.parentId ? selectedIds.has(fact.parentId) : false),
  );
}

async function selectDeterministically(
  facts: CareerFact[],
  analysis: JobAnalysis,
  profile: CareerProfile | undefined,
  similarity?: SemanticSimilarityService,
): Promise<EvidenceSelection | null> {
  const forced = facts.filter((fact) => fact.kind === 'experience' || fact.kind === 'education');
  const candidates = facts.filter(
    (fact) => fact.kind !== 'experience' && fact.kind !== 'education',
  );

  const budget = MAX_SELECTED_FACTS - forced.length;
  if (budget < 0) {
    // More mandatory facts than the cap allows — prioritisation needs judgement, not a score.
    return null;
  }

  if (!candidates.length) {
    return {
      selectedFactIds: forced.map((fact) => fact.id),
      rationale:
        'Deterministic selection: experience and education only, no additional evidence to rank.',
    };
  }

  const keywordScores = new Map(
    candidates.map((fact) => [fact.id, scoreFact(fact, analysis, profile)]),
  );
  const semanticScores = await semanticScoresFor(candidates, analysis, similarity);

  const scored = candidates
    .map((fact) => ({
      fact,
      score:
        (keywordScores.get(fact.id) ?? 0) + (semanticScores.get(fact.id) ?? 0) * SEMANTIC_WEIGHT,
    }))
    .sort((a, b) => b.score - a.score);

  if (scored.every((entry) => entry.score === 0)) {
    return null; // no deterministic signal at all — let the LLM judge relevance
  }

  const included = scored.slice(0, budget);
  const excluded = scored.slice(budget);

  if (excluded.length) {
    const boundaryScore = included[included.length - 1]?.score ?? 0;
    if (boundaryScore - excluded[0].score < TIE_MARGIN) return null; // genuine tie at the cutoff
  }

  return {
    selectedFactIds: [...forced.map((fact) => fact.id), ...included.map((entry) => entry.fact.id)],
    rationale: 'Deterministic keyword/semantic match against the job analysis.',
  };
}

async function semanticScoresFor(
  candidates: CareerFact[],
  analysis: JobAnalysis,
  similarity?: SemanticSimilarityService,
): Promise<Map<string, number>> {
  if (!similarity) return new Map();

  const query = [
    ...analysis.requiredSkills,
    ...analysis.preferredSkills,
    ...analysis.technologies,
    ...analysis.domains,
    ...analysis.responsibilities,
    ...analysis.keywords,
  ].join(', ');

  if (!query.trim()) return new Map();

  try {
    const ranked = await similarity.rank(
      query,
      candidates.map((fact) => ({ id: fact.id, text: fact.text || fact.id })),
    );
    return new Map(ranked.map((entry) => [entry.id, entry.score]));
  } catch {
    // Local embeddings unavailable (no WebGPU/WASM, model failed to load) — keyword score alone is fine.
    return new Map();
  }
}

async function selectViaLlm(
  run: AiRun,
  analysis: JobAnalysis,
  career: Career,
  profile: CareerProfile | undefined,
  facts: CareerFact[],
): Promise<EvidenceSelection> {
  const prompt = [
    `<job_analysis>${JSON.stringify(analysis)}</job_analysis>`,
    `<career_profile>${JSON.stringify(summariseProfile(profile, career))}</career_profile>`,
    `<career_facts>${JSON.stringify(facts)}</career_facts>`,
    '',
    'Select the fact ids that best evidence this role.',
    '- Return ids exactly as supplied. Never invent an id.',
    '- Include every experience fact that should appear on the CV, so the work history stays complete.',
    '- Include every education fact. Education is always relevant, even when it has no direct skill/domain match to the role.',
    '- Rank by required skills first, then preferred skills, then domains.',
    '- If a career profile is supplied, prioritise facts that match it. A profile prioritises, it does not exclude.',
    `- Select at most ${MAX_SELECTED_FACTS} ids.`,
  ].join('\n');

  const { data: raw } = await run<EvidenceSelection>({
    capability: 'evidence-selection',
    schema: evidenceSelectionSchema,
    systemInstruction:
      `You select career evidence for a job application. ${FACTUAL_RULES} ${DATA_BOUNDARY} ` +
      'Return only fact ids copied exactly from the supplied career facts.',
    prompt,
  });

  const known = new Set(facts.map((fact) => fact.id));

  return {
    selectedFactIds: (raw?.selectedFactIds ?? [])
      .filter((id) => known.has(id))
      .slice(0, MAX_SELECTED_FACTS),
    rationale: raw?.rationale ?? '',
  };
}
