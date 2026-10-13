import type { Job } from '../model/job';
import type { MatchingProfile } from './profile';
import { containsPhrase, tokens } from './text';

/** Starting weights. To be tuned with real data. They sum to 1. */
export const WEIGHTS = { role: 0.5, skills: 0.3, location: 0.2 } as const;

const MAX_SIGNALS = 8;
const SKILL_SATURATION = 8;
/** Credit when either side has no data, so a thin profile or listing is not scored to zero. */
const UNKNOWN = 0.5;

export interface JobText {
	titleTokens: string[];
	allTokens: string[];
}

export function jobText(job: Job): JobText {
	const titleTokens = tokens(job.role);
	return { titleTokens, allTokens: [...titleTokens, ...tokens(job.jobDescription)] };
}

function roleScore(profile: MatchingProfile, text: JobText, signals: string[]): number {
	if (!profile.roles.length) return UNKNOWN;
	let best = 0;
	let bestRole = '';
	for (const role of profile.roles) {
		const ratio = containsPhrase(text.titleTokens, role) ? 1 : role.filter((t) => text.titleTokens.includes(t)).length / role.length;
		if (ratio > best) {
			best = ratio;
			bestRole = role.join(' ');
		}
	}
	if (best >= 0.5) signals.push(`role:${bestRole}`);
	return best >= 0.5 ? best : 0;
}

function skillScore(profile: MatchingProfile, text: JobText, signals: string[]): number {
	if (!profile.skills.length) return UNKNOWN;
	const matched = profile.skills.filter((s) => containsPhrase(text.allTokens, s));
	for (const s of matched) signals.push(`skill:${s.join(' ')}`);
	return Math.min(1, matched.length / Math.min(profile.skills.length, SKILL_SATURATION));
}

const lower = (v: string | undefined) => v?.trim().toLowerCase();

/** 1 same city, 0.6 same region, 0.3 same country, 0 different place, UNKNOWN when either side is unknown. */
export function locationScore(profile: MatchingProfile, job: Job): number {
	const jl = job.location;
	const jobCity = lower(jl?.city);
	const jobRegion = lower(jl?.region);
	const jobCountry = lower(jl?.countryCode);
	const jobText = lower(job.legacyLocation);

	const userKnown = profile.city || profile.region || profile.countryCode || profile.legacyLocation;
	const jobKnown = jobCity || jobRegion || jobCountry || jobText;
	if (!userKnown || !jobKnown) return UNKNOWN;

	if (profile.city && jobCity === profile.city) return 1;
	if (profile.region && jobRegion === profile.region) return 0.6;
	const text = jobText ?? '';
	if (profile.city && text.includes(profile.city)) return 1;
	if (profile.region && text.includes(profile.region)) return 0.6;
	if (profile.legacyLocation && (jobText ?? lower(jl?.formatted) ?? '').includes(profile.legacyLocation)) return 0.6;
	if (profile.countryCode && jobCountry === profile.countryCode) return 0.3;
	return 0;
}

export interface Score {
	score: number;
	matchedSignals: string[];
}

export function scoreJob(profile: MatchingProfile, job: Job, text: JobText = jobText(job)): Score {
	const signals: string[] = [];
	const role = roleScore(profile, text, signals);
	const skills = skillScore(profile, text, signals);
	const loc = locationScore(profile, job);
	if (loc === 1) signals.push(`location:${profile.city ?? profile.legacyLocation}`);
	else if (loc >= 0.6) signals.push(`location:${profile.region ?? profile.legacyLocation}`);

	const score = Math.round(100 * (WEIGHTS.role * role + WEIGHTS.skills * skills + WEIGHTS.location * loc));
	return { score, matchedSignals: signals.slice(0, MAX_SIGNALS) };
}
