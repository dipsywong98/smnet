import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'

const external = [
  'react',
  'gamenet',
  'smnet',
  '@mui/material',
  '@mui/icon',
  'mdi-material-ui',
];

export default [
  {
    input: 'src/index.ts',
    plugins: [
      typescript({
        // cacheRoot: `${os.tmpdir}/.rpt2_cache`,
        tsconfig: 'tsconfig.json',
      }),
    ],
    external: external.concat(Object.keys(pkg.dependencies || [])),
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true },
    ],
  },
];
