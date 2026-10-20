#!/usr/bin/env node
// Missile recon: inventory a project directory and the local Claude Code arsenal.
// Usage: node recon.mjs [dir]
// Prints a Markdown report to stdout and writes <dir>/.missile/recon.json. Read-only apart from that file.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const root = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());
const home = os.homedir();
const IGNORE = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out', '.turbo', '.vercel', '.missile', 'coverage', '.cache', '.svelte-kit', '.astro', '.output', '.wrangler', 'android', 'ios', 'Pods', '.expo', 'target', 'vendor', '.venv', '__pycache__']);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.scss', '.svelte', '.astro', '.vue', '.html', '.mdx', '.md', '.json', '.py', '.go', '.rs', '.rb', '.php', '.java', '.kt', '.swift', '.dart', '.cs']);
const MAX_FILES = 20000;

function sh(cmd, cwd = root) {
  try { return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000, windowsHide: true }).toString().trim(); }
  catch { return null; }
}
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const exists = (p) => fs.existsSync(path.join(root, p));
function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }
function readText(p, cap = 400000) { try { return fs.readFileSync(p, 'utf8').slice(0, cap); } catch { return ''; } }

// ---------- app root: the folder that holds the web app's package.json (monorepos keep it in frontend/, web/, apps/x) ----------
const FRAMEWORK_DEPS = ['next', 'nuxt', '@sveltejs/kit', 'astro', '@remix-run/react', 'react-router', 'expo', 'react-native', '@angular/core', 'vite', 'gatsby', 'react', 'vue', 'svelte', 'solid-js'];
function findAppRoot() {
  if (fs.existsSync(path.join(root, 'package.json'))) return root;
  const dirs = (d) => { try { return fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory() && !IGNORE.has(e.name) && !e.name.startsWith('.')).map((e) => path.join(d, e.name)); } catch { return []; } };
  const level1 = dirs(root);
  const level2 = level1.filter((d) => /^(apps|packages)$/.test(path.basename(d))).flatMap(dirs);
  const candidates = [];
  for (const d of [...level1, ...level2]) {
    const pj = readJSON(path.join(d, 'package.json'));
    if (!pj) continue;
    const all = { ...(pj.dependencies || {}), ...(pj.devDependencies || {}) };
    const score = (FRAMEWORK_DEPS.some((k) => all[k]) ? 2 : 0) + (/^(frontend|web|client|app|ui|site|www)$/.test(path.basename(d)) ? 1 : 0);
    candidates.push({ d, score });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.d || root;
}
const appRoot = findAppRoot();
const appRel = path.relative(root, appRoot).split(path.sep).join('/') || '.';
const relA = (p) => path.relative(appRoot, p).split(path.sep).join('/');
const existsA = (p) => fs.existsSync(path.join(appRoot, p));
const backendDirs = ['', 'backend/', 'api/', 'server/'].filter((d) => exists(d + 'requirements.txt') || exists(d + 'pyproject.toml')).map((d) => d || './');

// ---------- walk ----------
const files = [];
function walk(dir, depth) {
  if (files.length >= MAX_FILES || depth > 12) return;
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (IGNORE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, depth + 1);
    else if (e.isFile()) files.push(full);
    if (files.length >= MAX_FILES) return;
  }
}
const empty = !fs.existsSync(root) || fs.readdirSync(root).filter((n) => !IGNORE.has(n) && n !== '.gitignore' && n !== 'README.md' && n !== 'LICENSE' && n !== 'docs' && n !== '.claude').length === 0;
if (fs.existsSync(root)) walk(root, 0);

// ---------- git ----------
const git = {
  repo: !!sh('git rev-parse --is-inside-work-tree'),
  branch: sh('git rev-parse --abbrev-ref HEAD'),
  dirty: (sh('git status --porcelain') || '').split('\n').filter(Boolean).length,
  lastCommit: sh('git log -1 --format=%cI'),
  commits: Number(sh('git rev-list --count HEAD') || 0),
  remote: sh('git remote get-url origin'),
};

// ---------- package ----------
const pkg = readJSON(path.join(appRoot, 'package.json'));
const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
const pm = existsA('pnpm-lock.yaml') ? 'pnpm' : existsA('bun.lock') || existsA('bun.lockb') ? 'bun' : existsA('yarn.lock') ? 'yarn' : existsA('package-lock.json') ? 'npm' : pkg ? 'pnpm (no lockfile)' : null;
const frameworks = [
  ['next', 'Next.js'], ['nuxt', 'Nuxt'], ['@sveltejs/kit', 'SvelteKit'], ['astro', 'Astro'], ['@remix-run/react', 'Remix'], ['react-router', 'React Router'],
  ['expo', 'Expo'], ['react-native', 'React Native'], ['@angular/core', 'Angular'], ['vite', 'Vite'], ['gatsby', 'Gatsby'], ['react', 'React'], ['vue', 'Vue'], ['svelte', 'Svelte'], ['solid-js', 'Solid'],
];
const framework = frameworks.find(([k]) => deps[k])?.[1] || (pkg ? 'Node (unknown framework)' : exists('pyproject.toml') || exists('requirements.txt') ? 'Python' : exists('Cargo.toml') ? 'Rust' : exists('go.mod') ? 'Go' : null);
const keyLibs = ['next', 'react', 'react-dom', 'typescript', 'tailwindcss', '@tailwindcss/postcss', '@tailwindcss/vite', 'motion', 'framer-motion', 'gsap', 'lenis', 'three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', '@shadergradient/react', 'html2canvas', '@splinetool/react-spline', '@paper-design/shaders-react', 'vite', 'astro', '@sveltejs/kit', 'svelte', 'vue', 'nuxt', 'expo', '@anthropic-ai/sdk', 'ai', '@ai-sdk/anthropic', '@supabase/supabase-js', 'convex', 'drizzle-orm', 'prisma', '@prisma/client', 'better-auth', '@clerk/nextjs', 'next-auth', 'vitest', 'jest', '@playwright/test', 'eslint', 'biome', '@biomejs/biome', 'prettier', 'lucide-react', '@phosphor-icons/react', 'radix-ui', '@base-ui/react', 'sonner', '@vercel/analytics', '@sentry/nextjs', 'posthog-js'];
const libs = Object.fromEntries(keyLibs.filter((k) => deps[k]).map((k) => [k, deps[k]]));
const scripts = pkg?.scripts || {};
const hasScript = (names) => names.find((n) => scripts[n]) || null;
const commands = {
  dev: hasScript(['dev', 'start', 'serve']),
  build: hasScript(['build']),
  typecheck: hasScript(['typecheck', 'type-check', 'tsc', 'check', 'svelte-check', 'astro:check']),
  lint: hasScript(['lint']),
  test: hasScript(['test', 'test:unit', 'vitest', 'jest']),
  e2e: hasScript(['test:e2e', 'e2e', 'playwright']),
};

// ---------- config files ----------
const configs = ['tsconfig.json', 'eslint.config.js', 'eslint.config.mjs', 'eslint.config.ts', '.eslintrc.json', '.eslintrc.js', 'biome.json', 'biome.jsonc', '.prettierrc', 'prettier.config.js', 'tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs', 'postcss.config.js', 'postcss.config.mjs', 'components.json', 'vitest.config.ts', 'vitest.config.mts', 'jest.config.js', 'jest.config.ts', 'playwright.config.ts', 'vercel.json', 'wrangler.toml', 'wrangler.jsonc', 'wrangler.json', 'netlify.toml', 'Dockerfile', 'docker-compose.yml', 'fly.toml', 'railway.json', 'next.config.js', 'next.config.mjs', 'next.config.ts', 'vite.config.ts', 'vite.config.js', 'astro.config.mjs', 'svelte.config.js', 'nuxt.config.ts', 'app.json', 'CLAUDE.md', 'DESIGN.md', 'PRODUCT.md', 'MISSILE.md', 'README.md', 'AGENTS.md', '.claude/launch.json', '.claude/settings.json', '.claude/settings.local.json', '.mcp.json', '.env.example', 'drizzle.config.ts', 'prisma/schema.prisma', 'supabase/config.toml', 'convex/schema.ts'];
const present = [...new Set([...configs.filter((c) => exists(c)), ...(appRoot !== root ? configs.filter((c) => existsA(c)).map((c) => appRel + '/' + c) : [])])];
const envFiles = fs.existsSync(root) ? fs.readdirSync(root).filter((n) => /^\.env(\..+)?$/.test(n)) : [];
const readmeSize = exists('README.md') ? fs.statSync(path.join(root, 'README.md')).size : 0;
const readmeIsScaffold = /create next app|This is a \[Next\.js\]|Vite \+ React|Welcome to your Expo app|## Getting Started\s+First, run the development server/i.test(readText(path.join(root, 'README.md'), 4000));

// ---------- routes ----------
const routes = [];
const routeMatchers = [
  { name: 'Next app router', when: !!deps.next, test: (r) => /^(src\/)?app\/.*page\.(tsx|jsx|ts|js|mdx)$/.test(r), toRoute: (r) => '/' + r.replace(/^(src\/)?app\//, '').replace(/page\.\w+$/, '').replace(/\(.*?\)\//g, '').replace(/\/$/, '') },
  { name: 'Next pages router', when: !!deps.next, test: (r) => /^(src\/)?pages\/(?!api\/|_app|_document).*\.(tsx|jsx|ts|js|mdx)$/.test(r), toRoute: (r) => '/' + r.replace(/^(src\/)?pages\//, '').replace(/\.\w+$/, '').replace(/index$/, '') },
  { name: 'Astro pages', when: !!deps.astro, test: (r) => /^src\/pages\/.*\.(astro|md|mdx)$/.test(r), toRoute: (r) => '/' + r.replace(/^src\/pages\//, '').replace(/\.\w+$/, '').replace(/index$/, '') },
  { name: 'SvelteKit routes', when: !!deps['@sveltejs/kit'], test: (r) => /^src\/routes\/.*\+page\.svelte$/.test(r), toRoute: (r) => '/' + r.replace(/^src\/routes\//, '').replace(/\+page\.svelte$/, '').replace(/\/$/, '') },
  { name: 'Remix / React Router routes', when: !!(deps['@remix-run/react'] || deps['react-router']), test: (r) => /^app\/routes\/.*\.(tsx|jsx|ts|js)$/.test(r), toRoute: (r) => '/' + r.replace(/^app\/routes\//, '').replace(/\.\w+$/, '').replace(/^_index$/, '').replace(/\./g, '/') },
  { name: 'Nuxt pages', when: !!deps.nuxt, test: (r) => /^pages\/.*\.vue$/.test(r), toRoute: (r) => '/' + r.replace(/^pages\//, '').replace(/\.vue$/, '').replace(/index$/, '') },
  { name: 'Expo router', when: !!deps.expo, test: (r) => /^app\/.*\.(tsx|jsx|ts|js)$/.test(r) && !/_layout/.test(r), toRoute: (r) => '/' + r.replace(/^app\//, '').replace(/\.\w+$/, '').replace(/index$/, '') },
];
let router = null;
for (const f of files) {
  if (appRoot !== root && !f.startsWith(appRoot + path.sep)) continue;
  const r = relA(f);
  for (const m of routeMatchers) {
    if (!m.when) continue;
    if (m.test(r)) { router = router || m.name; if (m.name === router) routes.push({ route: m.toRoute(r) || '/', file: rel(f) }); break; }
  }
}
if (!router && (deps.vite || deps.react) && files.some((f) => /src\/(main|index)\.(tsx|jsx|ts|js)$/.test(rel(f)))) { router = 'single page (Vite/React)'; routes.push({ route: '/', file: rel(files.find((f) => /src\/(main|index)\.(tsx|jsx|ts|js)$/.test(rel(f)))) }); }

// ---------- code stats and smells ----------
const byExt = {};
let loc = 0;
const smells = { lorem: 0, welcomeTo: 0, purpleGradient: 0, gradientText: 0, roundedLg: 0, consoleLog: 0, emojiHeadings: 0, interFont: 0, todo: 0 };
let themeBlock = false, cssVars = 0, fontLoader = false, googleFontsLink = false, reducedMotion = false, darkMode = false, ogImage = false, metadata = false, tests = 0, images = 0;
for (const f of files) {
  const ext = path.extname(f).toLowerCase();
  byExt[ext] = (byExt[ext] || 0) + 1;
  if (/\.(png|jpe?g|webp|avif|gif|svg)$/.test(ext)) images++;
  if (/\.(test|spec)\.[tj]sx?$/.test(f) || /__tests__/.test(f)) tests++;
  if (!CODE_EXT.has(ext) || ext === '.json' || ext === '.md') continue;
  const text = readText(f, 300000);
  loc += text.split('\n').length;
  if (/@theme\b/.test(text)) themeBlock = true;
  cssVars += (text.match(/--[a-z][\w-]*\s*:/gi) || []).length;
  if (/next\/font|@fontsource|fontsource-variable/.test(text)) fontLoader = true;
  if (/fonts\.googleapis\.com/.test(text)) googleFontsLink = true;
  if (/prefers-reduced-motion/.test(text)) reducedMotion = true;
  if (/prefers-color-scheme|data-theme|\.dark\b|dark:/.test(text)) darkMode = true;
  if (/opengraph-image|ImageResponse|og:image/.test(text)) ogImage = true;
  if (/export const metadata|generateMetadata|<title>|<Head>|useHead|<svelte:head>/.test(text)) metadata = true;
  smells.lorem += (text.match(/lorem ipsum/gi) || []).length;
  smells.welcomeTo += (text.match(/Welcome to\b/g) || []).length;
  smells.purpleGradient += (text.match(/from-(purple|violet|indigo|fuchsia)-\d+/g) || []).length;
  smells.gradientText += (text.match(/bg-clip-text/g) || []).length;
  smells.roundedLg += (text.match(/rounded-(lg|xl|2xl)\b/g) || []).length;
  smells.consoleLog += (text.match(/console\.log\(/g) || []).length;
  smells.emojiHeadings += (text.match(/<h[1-6][^>]*>\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;
  smells.interFont += (text.match(/\bInter\b/g) || []).length;
  smells.todo += (text.match(/\b(TODO|FIXME|HACK)\b/g) || []).length;
}

// ---------- machine and arsenal ----------
const tools = {
  node: sh('node --version'), pnpm: sh('pnpm --version'), npm: sh('npm --version'), bun: sh('bun --version'), yarn: sh('yarn --version'),
  git: sh('git --version'), gh: sh('gh --version')?.split('\n')[0], vercel: sh('vercel --version'), wrangler: sh('wrangler --version'),
  playwrightCli: sh('playwright-cli --version'), ffmpeg: sh('ffmpeg -version')?.split('\n')[0]?.slice(0, 40), claude: sh('claude --version'),
  vercelLoggedIn: (() => { const w = sh('vercel whoami'); return !!w && !/logged out|not logged in|no existing credentials/i.test(w); })(),
};
const skillsDir = path.join(home, '.claude', 'skills');
const personalSkills = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir) : [];
const projectSkillsDir = path.join(root, '.claude', 'skills');
const projectSkills = fs.existsSync(projectSkillsDir) ? fs.readdirSync(projectSkillsDir) : [];
const installed = readJSON(path.join(home, '.claude', 'plugins', 'installed_plugins.json'));
const plugins = installed?.plugins ? Object.keys(installed.plugins) : [];
const claudeJson = readJSON(path.join(home, '.claude.json'));
const userMcp = claudeJson?.mcpServers ? Object.keys(claudeJson.mcpServers) : [];
const projectMcpJson = readJSON(path.join(root, '.mcp.json'));
const projectMcp = projectMcpJson?.mcpServers ? Object.keys(projectMcpJson.mcpServers) : [];
const mcpList = sh('claude mcp list') || '';
const mcpStatus = mcpList.split('\n').filter((l) => /[✓✗]|Connected|Failed/.test(l)).map((l) => l.trim());
const has = (name) => personalSkills.some((s) => s.toLowerCase().includes(name)) || projectSkills.some((s) => s.toLowerCase().includes(name)) || plugins.some((p) => p.toLowerCase().includes(name));
const arsenal = {
  'frontend-design plugin': plugins.some((p) => p.startsWith('frontend-design')),
  'taste-skill': has('taste'),
  'impeccable': has('impeccable'),
  'emil animate': has('animate'),
  'web-design-guidelines': has('web-design-guidelines'),
  'hallmark': has('hallmark'),
  'uipro': !!sh('uipro --version') || has('ui-ux-pro-max'),
  'superpowers': has('superpowers'),
  'ralph-loop': has('ralph'),
  'playwright-cli': !!tools.playwrightCli,
  'mcp context7': /context7/i.test(mcpList) || projectMcp.includes('context7'),
  'mcp shadcn': projectMcp.includes('shadcn') || /shadcn/i.test(mcpList),
  'mcp watermelon': /watermelon/i.test(mcpList),
  'mcp chrome-devtools': /chrome-devtools/i.test(mcpList),
  'mcp vercel': /vercel/i.test(mcpList),
  'mcp supabase': /supabase/i.test(mcpList) || projectMcp.includes('supabase'),
  'mcp figma': plugins.some((p) => p.startsWith('figma')) || /figma/i.test(mcpList),
};

// ---------- verdict ----------
let verdict = 'new';
if (!empty && pkg) verdict = (commands.build && git.repo && git.commits > 3) ? 'existing' : 'existing-fragile';
else if (!empty) verdict = 'existing-unknown';

const report = { root, appRoot: appRel, backendDirs, verdict, empty, git, pm, framework, router, libs, scripts: Object.keys(scripts), commands, present, envFiles, readme: { size: readmeSize, scaffold: readmeIsScaffold }, routes: routes.slice(0, 40), stats: { files: files.length, loc, byExt, images, tests }, design: { themeBlock, cssVars, fontLoader, googleFontsLink, reducedMotion, darkMode, ogImage, metadata }, smells, tools, arsenal, personalSkills, projectSkills, plugins, userMcp, projectMcp, mcpStatus, generated: new Date().toISOString() };

if (!dry) { try { fs.mkdirSync(path.join(root, '.missile'), { recursive: true }); fs.writeFileSync(path.join(root, '.missile', 'recon.json'), JSON.stringify(report, null, 2)); } catch {} }

// ---------- markdown ----------
const yn = (v) => (v ? 'yes' : 'no');
const lines = [];
lines.push(`# Recon: ${pkg?.name || path.basename(root)}`);
lines.push('');
lines.push(`- Directory: ${root}`);
lines.push(`- Verdict: **${verdict}**${empty ? ' (empty directory)' : ''}`);
lines.push(`- Git: ${git.repo ? `branch ${git.branch}, ${git.commits} commits, ${git.dirty} uncommitted changes, last commit ${git.lastCommit || 'n/a'}${git.remote ? ', remote ' + git.remote : ''}` : 'not a repository'}`);
lines.push(`- Framework: ${framework || 'none detected'}${router ? ` (${router})` : ''}; package manager: ${pm || 'none'}`);
if (appRel !== '.') lines.push(`- App root: ${appRel}/ (the commands below run there)`);
if (backendDirs.length) lines.push(`- Backend: Python (requirements in ${backendDirs.join(', ')})`);
lines.push('');
lines.push('## Commands');
for (const [k, v] of Object.entries(commands)) lines.push(`- ${k}: ${v ? `\`${pm?.split(' ')[0] || 'npm'} run ${v}\`` : 'missing'}`);
lines.push('');
lines.push('## Key libraries');
lines.push(Object.keys(libs).length ? Object.entries(libs).map(([k, v]) => `- ${k} ${v}`).join('\n') : '- none');
lines.push('');
lines.push('## Routes / screens' + (routes.length > 12 ? ` (first 12 of ${routes.length})` : ''));
lines.push(routes.length ? routes.slice(0, 12).map((r) => `- ${r.route}  (${r.file})`).join('\n') : '- none detected');
lines.push('');
lines.push('## Design system signals');
lines.push(`- Tailwind @theme block: ${yn(themeBlock)}; CSS custom properties: ${cssVars}; font loader (next/font or fontsource): ${yn(fontLoader)}; Google Fonts link tag: ${yn(googleFontsLink)}`);
lines.push(`- Dark mode handling: ${yn(darkMode)}; reduced-motion handling: ${yn(reducedMotion)}; OG image: ${yn(ogImage)}; metadata/titles: ${yn(metadata)}`);
lines.push(`- Smells: lorem ipsum ${smells.lorem}, "Welcome to" ${smells.welcomeTo}, purple/indigo gradients ${smells.purpleGradient}, gradient text ${smells.gradientText}, rounded-lg+ ${smells.roundedLg}, Inter mentions ${smells.interFont}, emoji headings ${smells.emojiHeadings}, console.log ${smells.consoleLog}, TODO/FIXME ${smells.todo}`);
lines.push('');
lines.push('## Code');
lines.push(`- Files: ${files.length}; lines of code: ${loc}; images: ${images}; test files: ${tests}`);
lines.push(`- Config present: ${present.join(', ') || 'none'}`);
lines.push(`- Env files (names only): ${envFiles.join(', ') || 'none'}`);
lines.push(`- README: ${readmeSize ? `${readmeSize} bytes${readmeIsScaffold ? ' (scaffold default)' : ''}` : 'missing'}`);
lines.push('');
lines.push('## Machine');
lines.push(Object.entries(tools).map(([k, v]) => `- ${k}: ${v === true ? 'yes' : v === false ? 'no' : v || 'missing'}`).join('\n'));
lines.push('');
lines.push('## Arsenal');
lines.push(Object.entries(arsenal).map(([k, v]) => `- ${k}: ${v ? 'present' : 'missing'}`).join('\n'));
lines.push(`- Personal skills: ${personalSkills.join(', ') || 'none'}`);
lines.push(`- Project skills: ${projectSkills.join(', ') || 'none'}`);
lines.push(`- Plugins: ${plugins.join(', ') || 'none'}`);
lines.push(`- MCP servers (user): ${userMcp.join(', ') || 'none'}; (project): ${projectMcp.join(', ') || 'none'}`);
if (mcpStatus.length) lines.push(`- MCP status: ${mcpStatus.join(' | ')}`);
lines.push('');
lines.push(dry ? 'Dry run: recon.json not written' : `Saved: ${rel(path.join(root, '.missile', 'recon.json')) || '.missile/recon.json'}`);
console.log(lines.join('\n'));
