import { spawnSync } from 'node:child_process';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const repo = 'sickabroad66-glitch/podarok-olya';
function run(args, options = {}) {
  const result = spawnSync(args[0], args.slice(1), { cwd: root, encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(`${args[0]} failed: ${result.stderr || result.error || result.status}`);
  return result.stdout?.trim() ?? '';
}
const git = ['git', '-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential'];
const remote = run(['git', 'remote', 'get-url', 'origin']);
if (![ `https://github.com/${repo}.git`, `https://github.com/${repo}`, `git@github.com:${repo}.git` ].includes(remote)) {
  throw new Error('Unexpected publication repository. Nothing uploaded.');
}
if (run(['git', 'status', '--porcelain'])) throw new Error('Commit the reviewed source before publishing.');
const sourceCommit = run(['git', 'rev-parse', 'HEAD']);
for (const name of ['test', 'check', 'build']) run(['npm', 'run', name], { stdio: 'inherit' });
const remoteBranch = run([...git, 'ls-remote', '--heads', 'origin', 'gh-pages']);
let parent;
if (remoteBranch) {
  run([...git, 'fetch', 'origin', 'gh-pages']);
  parent = run(['git', 'rev-parse', 'FETCH_HEAD']);
}
const index = resolve(root, run(['git', 'rev-parse', '--git-path', 'pages-release.index']));
await unlink(index).catch(error => { if (error.code !== 'ENOENT') throw error; });
try {
  const env = { ...process.env, GIT_INDEX_FILE: index };
  const treeGit = ['git', `--git-dir=${resolve(root, run(['git', 'rev-parse', '--git-dir']))}`, `--work-tree=${resolve(root, 'dist')}`];
  run([...treeGit, 'add', '--all', '--', '.'], { env, cwd: resolve(root, 'dist') });
  const tree = run([...treeGit, 'write-tree'], { env });
  const paths = run(['git', 'ls-tree', '-r', '--name-only', tree]).split('\n');
  if (!paths.includes('index.html') || paths.some(path => !['index.html', 'app.js', 'styles.css', 'robots.txt', '.nojekyll'].includes(path) && !/^(?:assets|data|lib)\//.test(path))) {
    throw new Error('Unexpected files in publication tree. Nothing uploaded.');
  }
  const commit = run(['git', 'commit-tree', tree, ...(parent ? ['-p', parent] : [])], {
    input: `Publish reviewed site ${sourceCommit}\n`,
  });
  run(['git', 'update-ref', 'refs/heads/gh-pages', commit]);
  run([...git, 'push', 'origin', 'gh-pages'], { stdio: 'inherit' });
  console.log(`Published branch commit ${commit}; source ${sourceCommit}.`);
} finally {
  await unlink(index).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
