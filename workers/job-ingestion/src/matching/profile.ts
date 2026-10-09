import type { FsRecord } from '../firestore/client';
import { splitList, tokens } from './text';

export interface MatchingProfile {
	uid: string;
	roles: string[][];
	skills: string[][];
	city?: string;
	region?: string;
	countryCode?: string;
	legacyLocation?: string;
}

const asRecord = (v: unknown): FsRecord => (v && typeof v === 'object' && !Array.isArray(v) ? (v as FsRecord) : {});
const asArray = (v: unknown): FsRecord[] => (Array.isArray(v) ? v.map(asRecord) : []);
const asString = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().toLowerCase() : undefined);

function uniquePhrases(phrases: Array<string | undefined>): string[][] {
	const seen = new Set<string>();
	const out: string[][] = [];
	for (const p of phrases) {
		const t = tokens(p);
		const key = t.join(' ');
		if (t.length && !seen.has(key)) {
			seen.add(key);
			out.push(t);
		}
	}
	return out;
}

export function toMatchingProfile(uid: string, user: FsRecord): MatchingProfile {
	const info = asRecord(user['info']);
	const career = asRecord(user['career']);
	const profiles = asArray(career['careerProfiles']);

	const roles = uniquePhrases([
		info['title'] as string | undefined,
		...splitList(info['targetRoles'] as string | undefined),
		...profiles.map((p) => p['name'] as string | undefined),
		...asArray(career['experience']).map((e) => e['role'] as string | undefined),
	]);
	const skills = uniquePhrases([
		...asArray(career['skills']).map((s) => s['name'] as string | undefined),
		...profiles.flatMap((p) => (Array.isArray(p['domains']) ? (p['domains'] as string[]) : [])),
	]);

	const location = info['location'];
	const loc = asRecord(location);
	return {
		uid,
		roles,
		skills,
		city: asString(loc['city']),
		region: asString(loc['region']),
		countryCode: asString(loc['countryCode']),
		legacyLocation: typeof location === 'string' ? asString(location) : undefined,
	};
}
