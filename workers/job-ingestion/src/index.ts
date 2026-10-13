import { Env, loadServiceAccount } from './env';
import { getAccessToken } from './google/auth';
import { FirestoreClient } from './firestore/client';
import { runConnectivityCheck } from './firestore/connectivity';
import { JobSource, SourceError } from './sources/types';
import { buildSources, findSource } from './sources/registry';
import { SEARCH_PLANS } from './ingestion/search-plans';
import { runIngestion } from './ingestion/ingestion.service';
import { CollectingSink } from './ingestion/sink';
import { MatchingSink } from './matching/recommendation.sink';
import { RecommendationsRepository } from './firestore/recommendations.repository';
import { UsersRepository } from './firestore/users.repository';
import { planFromUsers } from './matching/query-planner';
import { WorkersAiRefiner } from './matching/ai-refiner';
import { UsageMeter } from './budget/usage-meter';
import { estimateDaily, parseSubrequestLimit, runCaps } from './budget/budget';
import { ExpirySweeper } from './lifecycle/expiry-sweeper';

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});

function isAuthorised(request: Request, env: Env): boolean {
	const header = request.headers.get('authorization') ?? '';
	const supplied = new TextEncoder().encode(header.replace(/^Bearer /, ''));
	const expected = new TextEncoder().encode(env.DIAGNOSTICS_TOKEN ?? '');
	if (!expected.length || supplied.length !== expected.length) return false;
	return crypto.subtle.timingSafeEqual(supplied, expected);
}

function newMeter(env: Env, sources: JobSource[]): UsageMeter {
	const pages = Math.max(0, ...sources.map((s) => SEARCH_PLANS[s.id]?.maxPagesPerRun ?? 0)) * Math.max(1, sources.length);
	return new UsageMeter(runCaps(parseSubrequestLimit(env.SUBREQUEST_LIMIT), pages));
}

async function runMatching(env: Env, source: JobSource, meter: UsageMeter, sourcesLeft = 1) {
	const plan = SEARCH_PLANS[source.id];
	if (!plan) throw new Error(`No search plan for source "${source.id}"`);

	const key = loadServiceAccount(env);
	const db = new FirestoreClient(env.FIREBASE_PROJECT_ID, env.FIRESTORE_DATABASE_ID, () => getAccessToken(key), meter);
	const recs = new RecommendationsRepository(db);
	const now = new Date();

	const users = await new UsersRepository(db).loadActive(now);
	const usersArr = [];

	for (const user of users) {
		const u = {
			uid: user.profile.uid,
			lastSweptAt: user.lastSweptAt,
		};
		usersArr.push(u);
	}

	const sweep = await new ExpirySweeper(db, meter).sweep(usersArr, now);
	const wanted = users.filter((u) => !u.sources || u.sources.has(source.id));
	if (!wanted.length) return { source: source.id, sweep, users: 0, skipped: users.length, usage: meter.snapshot().used };

	const writeBudget = Math.floor(meter.remaining('writes') / sourcesLeft);
	const sink = new MatchingSink(wanted, recs, now, writeBudget, env.AI ? new WorkersAiRefiner(env.AI) : undefined);
	const ingestion = await runIngestion(
		source,
		sink,
		planFromUsers(
			plan,
			wanted.map((u) => u.profile),
		),
		now,
	);
	return { source: source.id, sweep, ingestion, matching: sink.stats, usage: meter.snapshot().used };
}

export default {
	async scheduled(_event, env, ctx): Promise<void> {
		ctx.waitUntil(
			(async () => {
				const sources = buildSources(env).filter((s) => s.id !== 'fake');
				const meter = newMeter(env, sources);
				for (const [i, source] of sources.entries()) {
					try {
						console.log(JSON.stringify(await runMatching(env, source, meter, sources.length - i)));
					} catch (e) {
						console.error(`matching failed: ${source.id}: ${(e as Error).message}`);
					}
				}
			})(),
		);
	},

	async fetch(request, env): Promise<Response> {
		const { pathname } = new URL(request.url);

		if (request.method === 'GET' && pathname === '/health') {
			return json({ ok: true, service: 'job-ingestion', environment: env.ENVIRONMENT });
		}

		if (request.method === 'POST' && pathname === '/diagnostics/firestore') {
			if (!isAuthorised(request, env)) return json({ error: 'unauthorised' }, 401);
			if (env.ENVIRONMENT !== 'staging') return json({ error: 'staging only' }, 403);

			try {
				const key = loadServiceAccount(env);
				const getToken = () => getAccessToken(key);
				const result = await runConnectivityCheck(
					new FirestoreClient(env.FIREBASE_PROJECT_ID, env.FIRESTORE_DATABASE_ID, getToken),
					getToken,
				);
				return json(
					{ environment: env.ENVIRONMENT, project: env.FIREBASE_PROJECT_ID, database: env.FIRESTORE_DATABASE_ID, ...result },
					result.ok ? 200 : 502,
				);
			} catch (e) {
				return json({ ok: false, error: (e as Error).message }, 500);
			}
		}

		if (request.method === 'POST' && pathname === '/diagnostics/budget') {
			if (!isAuthorised(request, env)) return json({ error: 'unauthorised' }, 401);
			if (env.ENVIRONMENT !== 'staging') return json({ error: 'staging only' }, 403);

			const input = (await request.json().catch(() => ({}))) as Record<string, unknown>;
			const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);
			return json(
				estimateDaily({
					activeUsers: num(input.activeUsers) ?? 0,
					recsPerUserPerRun: num(input.recsPerUserPerRun),
					avgStoredPerUser: num(input.avgStoredPerUser),
					clientReadsPerUserPerDay: num(input.clientReadsPerUserPerDay),
				}),
			);
		}

		const sourceRoute = pathname.match(/^\/diagnostics\/sources\/([a-z0-9-]+)$/);
		if (request.method === 'POST' && sourceRoute) {
			if (!isAuthorised(request, env)) return json({ error: 'unauthorised' }, 401);
			if (env.ENVIRONMENT !== 'staging') return json({ error: 'staging only' }, 403);

			const source = findSource(buildSources(env), sourceRoute[1]);
			if (!source) return json({ error: 'unknown or unconfigured source' }, 404);

			const input = (await request.json().catch(() => ({}))) as Record<string, unknown>;
			const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
			const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

			try {
				const page = await source.fetchJobs({
					page: num(input.page) ?? 1,
					pageSize: Math.min(num(input.pageSize) ?? 5, 10),
					what: str(input.what),
					where: str(input.where),
					category: str(input.category),
					maxDaysOld: num(input.maxDaysOld),
				});
				return json({
					source: source.id,
					page: page.page,
					total: page.total,
					hasMore: page.hasMore,
					jobs: page.jobs.map((j) => source.mapJob(j)),
				});
			} catch (e) {
				const status = e instanceof SourceError ? 502 : 500;
				return json({ ok: false, source: source.id, error: (e as Error).message }, status);
			}
		}

		const ingestRoute = pathname.match(/^\/diagnostics\/ingest\/([a-z0-9-]+)$/);
		if (request.method === 'POST' && ingestRoute) {
			if (!isAuthorised(request, env)) return json({ error: 'unauthorised' }, 401);
			if (env.ENVIRONMENT !== 'staging') return json({ error: 'staging only' }, 403);

			const source = findSource(buildSources(env), ingestRoute[1]);
			if (!source) return json({ error: 'unknown or unconfigured source' }, 404);

			const plan = SEARCH_PLANS[source.id];
			if (!plan) return json({ error: 'no search plan for source' }, 404);

			const sink = new CollectingSink();
			const stats = await runIngestion(source, sink, plan);
			return json({ stats, jobs: sink.items.slice(0, 20).map((i) => i.job) }, stats.failed ? 502 : 200);
		}

		const matchRoute = pathname.match(/^\/diagnostics\/matching\/([a-z0-9-]+)$/);
		if (request.method === 'POST' && matchRoute) {
			if (!isAuthorised(request, env)) return json({ error: 'unauthorised' }, 401);
			if (env.ENVIRONMENT !== 'staging') return json({ error: 'staging only' }, 403);

			const source = findSource(buildSources(env), matchRoute[1]);
			if (!source) return json({ error: 'unknown or unconfigured source' }, 404);

			try {
				const result = await runMatching(env, source, newMeter(env, [source]));
				return json(result, 'ingestion' in result && result.ingestion?.failed ? 502 : 200);
			} catch (e) {
				return json({ ok: false, error: (e as Error).message }, 500);
			}
		}

		return json({ error: 'not found' }, 404);
	},
} satisfies ExportedHandler<Env>;
