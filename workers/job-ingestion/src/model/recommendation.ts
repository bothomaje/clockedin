import type { Job } from './job';

export interface Recommendation {
	job: Job;
	score: number;
	matchedSignals: string[];
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
