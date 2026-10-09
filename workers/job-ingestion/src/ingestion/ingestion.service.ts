import type { JobSource } from '../sources/types';
import { jobKey } from './deduplicator';
import { normaliseJob } from './normaliser';
import type { SearchPlan } from './search-plans';
import { JobSink, KeyedJob } from './sink';
import { validateJob } from './validator';

export interface IngestionStats {
	source: string;
	startedAt: string;
	pages: number;
	fetched: number;
	accepted: number;
	skipped: number;
	duplicates: number;
	failed: number;
	skipReasons: Record<string, number>;
	errors: string[];
}

const MAX_ERRORS = 10;

export async function runIngestion(source: JobSource, sink: JobSink, plan: SearchPlan, now = new Date()): Promise<IngestionStats> {
	const stats: IngestionStats = {
		source: source.id,
		startedAt: now.toISOString(),
		pages: 0,
		fetched: 0,
		accepted: 0,
		skipped: 0,
		duplicates: 0,
		failed: 0,
		skipReasons: {},
		errors: [],
	};
	const seen = new Set<string>();
	const skip = (reason: string) => {
		stats.skipped++;
		stats.skipReasons[reason] = (stats.skipReasons[reason] ?? 0) + 1;
	};
	const fail = (message: string) => {
		if (stats.errors.length < MAX_ERRORS) stats.errors.push(message);
	};

	outer: for (const query of plan.queries) {
		for (let page = 1; page <= plan.maxPagesPerQuery; page++) {
			if (stats.pages >= plan.maxPagesPerRun) break outer;
			stats.pages++;

			let result;
			try {
				result = await source.fetchJobs({ ...query, page, pageSize: plan.pageSize, maxDaysOld: plan.maxDaysOld });
			} catch (e) {
				stats.failed++;
				fail(`fetch: ${(e as Error).message}`);
				break;
			}
			stats.fetched += result.jobs.length;

			const batch: KeyedJob[] = [];
			for (const raw of result.jobs) {
				let job;
				try {
					job = normaliseJob(source.mapJob(raw));
				} catch {
					skip('map_error');
					continue;
				}
				const reason = validateJob(job);
				if (reason) {
					skip(reason);
					continue;
				}
				const key = jobKey(job);
				if (seen.has(key)) {
					stats.duplicates++;
					continue;
				}
				seen.add(key);
				batch.push({ key, job });
			}

			try {
				await sink.accept(batch);
				stats.accepted += batch.length;
			} catch (e) {
				stats.failed += batch.length;
				fail(`sink: ${(e as Error).message}`);
				break outer;
			}

			if (!result.hasMore) break;
		}
	}
	try {
		await sink.finish?.();
	} catch (e) {
		stats.failed++;
		fail(`sink finish: ${(e as Error).message}`);
	}
	return stats;
}
