import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'

const external = [
  'react',
  'gamenet',
  'smnet',
  '@material-ui/core',
  '@material-ui/icon',
  '@material-ui/lab',
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
