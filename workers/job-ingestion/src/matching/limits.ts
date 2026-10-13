export const RECOMMENDATION_LIMITS = {
	minScore: 30,
	maxPerUserPerRun: 20,
	freshnessDays: 14,
	maxDescriptionChars: 5_000,
	maxActiveUsersPerRun: 100,
	activeWindowDays: 30,
	maxExpiredDeletesPerRun: 200,
} as const;

export const AI_LIMITS = {
	model: '@cf/meta/llama-3.1-8b-instruct-fast',
	maxPerUserPerRun: 3,
	maxPerRun: 20,
	concurrency: 4,
	blend: 0.4,
	maxDescriptionChars: 1_500,
	maxProfileSkills: 15,
	maxWhyChars: 240,
	maxConcernChars: 120,
	maxConcerns: 3,
} as const;
