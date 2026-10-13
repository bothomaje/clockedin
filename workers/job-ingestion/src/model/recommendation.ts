import type { Job } from './job';

export interface AiInsight {
	matchScore: number;
	whyItMatches: string;
	potentialConcerns: string[];
	refinedAt: Date;
}

export interface Recommendation {
	job: Job;
	score: number;
	matchedSignals: string[];
	ai?: AiInsight;
	generatedAt: Date;
	lastSeenAt: Date;
	expireAt: Date;
}

export interface DiscoveryState {
	dismissed: Record<string, Date>;
	saved: Record<string, Date>;
	enabled?: boolean;
	lastActiveAt?: Date;
	refreshRequestedAt?: Date;
}
