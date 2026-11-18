import { defineConfig } from 'eslint/config';
import scality from '@scality/eslint-config-scality';
import { mocha } from '@scality/eslint-config-scality/testing';

export default defineConfig(
    ...scality,
    {
        files: ['**/*.js', 'bin/vaultclient'],
        languageOptions: {
            sourceType: 'commonjs',
        },
    },
    mocha(['tests/**/*.js']),
);
