import { Env, loadServiceAccount } from './env';
import { getAccessToken } from './google/auth';
import { FirestoreClient } from './firestore/client';
import { runConnectivityCheck } from './firestore/connectivity';

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

export default {
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

		return json({ error: 'not found' }, 404);
	},
} satisfies ExportedHandler<Env>;
