const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/datastore';

export interface ServiceAccountKey {
	client_email: string;
	private_key: string;
	project_id: string;
}

export function parseServiceAccount(raw: string): ServiceAccountKey {
	let key: Partial<ServiceAccountKey>;
	try {
		key = JSON.parse(raw);
	} catch {
		throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
	}
	if (!key.client_email || !key.private_key || !key.project_id) {
		throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing required fields');
	}
	return key as ServiceAccountKey;
}

function base64Url(input: string | ArrayBuffer): string {
	const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
	const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s/g, '');
	const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
	return crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

async function signJwt(key: ServiceAccountKey): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const unsigned =
		`${base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.` +
		base64Url(
			JSON.stringify({
				iss: key.client_email,
				scope: SCOPE,
				aud: TOKEN_URL,
				iat: now,
				exp: now + 3600,
			}),
		);
	const signature = await crypto.subtle.sign(
		'RSASSA-PKCS1-v1_5',
		await importPrivateKey(key.private_key),
		new TextEncoder().encode(unsigned),
	);
	return `${unsigned}.${base64Url(signature)}`;
}

let cached: { token: string; expiresAt: number } | undefined;

export async function getAccessToken(key: ServiceAccountKey): Promise<string> {
	if (cached && cached.expiresAt - 60_000 > Date.now()) return cached.token;

	const res = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: await signJwt(key),
		}),
	});
	if (!res.ok) {
		const err = (await res.json().catch(() => ({}))) as { error?: string };
		throw new Error(`Google token exchange failed: ${res.status} ${err.error ?? ''}`.trim());
	}
	const data = (await res.json()) as { access_token: string; expires_in: number };
	cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
	return data.access_token;
}
