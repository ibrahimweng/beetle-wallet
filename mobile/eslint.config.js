/* Expo's rules, plus the two the design system leans on: state that is not
   read is a mistake here, and a file in src/state is plain JavaScript shared
   with the web build, so it is not held to the TypeScript rules. */
const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  { ignores: ['dist/*', 'src/state/*.js', 'src/icons.ts'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      /* The base rule counts the parameter names inside a type signature as
         variables, so TypeScript's own version is the one that runs. */
      'no-unused-vars': 'off',
    },
  },
];
