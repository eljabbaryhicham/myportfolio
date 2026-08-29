import config from 'eslint-config-next';

const eslintConfig = [
  ...config,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/use-memo': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
];

export default eslintConfig;
