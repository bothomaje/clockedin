import type { Env } from '../env';
import { createAdzunaSource } from './adzuna/adzuna.source';
import { fakeSource } from './fake/fake.source';
import type { JobSource } from './types';

export function buildSources(env: Env): JobSource[] {
	const sources: JobSource[] = [];
	if (env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY) {
		sources.push(createAdzunaSource(env.ADZUNA_APP_ID, env.ADZUNA_APP_KEY));
	}
	if (env.ENVIRONMENT === 'staging') sources.push(fakeSource);

	const ids = sources.map((s) => s.id);
	if (new Set(ids).size !== ids.length) throw new Error(`Duplicate job source id in registry: ${ids.join(', ')}`);
	return sources;
}

export function findSource(sources: JobSource[], id: string): JobSource | undefined {
	return sources.find((s) => s.id === id);
}
