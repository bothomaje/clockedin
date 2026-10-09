export const RECOMMENDATION_LIMITS = {
	minScore: 30,
	maxPerUserPerRun: 20,
	freshnessDays: 14,
	maxDescriptionChars: 5_000,
	maxActiveUsersPerRun: 100,
	activeWindowDays: 30,
	maxExpiredDeletesPerRun: 200,
} as const;
