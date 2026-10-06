import { parseServiceAccount, ServiceAccountKey } from './google/auth';

export interface Env {
	ENVIRONMENT: 'staging' | 'production';
	FIREBASE_PROJECT_ID: string;
	FIRESTORE_DATABASE_ID: string;
	GOOGLE_SERVICE_ACCOUNT_JSON: string;
	DIAGNOSTICS_TOKEN: string;
	ADZUNA_APP_ID?: string;
	ADZUNA_APP_KEY?: string;
}

const EXPECTED_PROJECT = {
	staging: 'clockedin-staging',
	production: 'clockedin-prod',
} as const;

export function loadServiceAccount(env: Env): ServiceAccountKey {
	const expected = EXPECTED_PROJECT[env.ENVIRONMENT];
	if (!expected) throw new Error(`Unknown ENVIRONMENT "${env.ENVIRONMENT}"`);

	const key = parseServiceAccount(env.GOOGLE_SERVICE_ACCOUNT_JSON);
	if (env.FIREBASE_PROJECT_ID !== expected || key.project_id !== expected) {
		throw new Error(
			`Project mismatch: ${env.ENVIRONMENT} must use ${expected} ` + `(vars=${env.FIREBASE_PROJECT_ID}, key=${key.project_id})`,
		);
	}
	return key;
}
