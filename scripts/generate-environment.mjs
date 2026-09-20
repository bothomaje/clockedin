import fs from 'node:fs';
import path from 'node:path';

const environment = process.argv[2];

const supportedEnvironments = ['development', 'staging', 'production'];

if (!supportedEnvironments.includes(environment)) {
  console.error(
    `Invalid environment "${environment}". ` +
      `Expected one of: ${supportedEnvironments.join(', ')}`,
  );

  process.exit(1);
}

const requiredVariables = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_USE_EMULATORS',
];

const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  console.error(
    'Missing required environment variables:\n' +
      missingVariables.map((name) => `  - ${name}`).join('\n'),
  );

  process.exit(1);
}

const useEmulators = process.env.FIREBASE_USE_EMULATORS === 'true';

const expectedUseEmulators = environment === 'development';

if (useEmulators !== expectedUseEmulators) {
  console.error(
    `Invalid emulator configuration for "${environment}".\n` +
      `Expected FIREBASE_USE_EMULATORS=${expectedUseEmulators}, ` +
      `but received ${useEmulators}.`,
  );

  process.exit(1);
}

const production = environment !== 'development';

const environmentFile =
  environment === 'production' ? 'environment.ts' : `environment.${environment}.ts`;

const outputPath = path.resolve('src', 'environments', environmentFile);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const config = {
  production,
  useEmulators,

  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  },
};

const fileContents = `export const environment = ${JSON.stringify(config, null, 2)} as const;
`;

fs.writeFileSync(outputPath, fileContents);

console.log(`Generated ${path.relative(process.cwd(), outputPath)}`);
