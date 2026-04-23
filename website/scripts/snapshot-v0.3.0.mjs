#!/usr/bin/env node
/**
 * One-shot snapshot generator for version-0.3.0 docs.
 *
 * Reads README + docs/ + demo/ from the local skardi checkout and writes
 * a complete versioned_docs/version-0.3.0/ tree.
 *
 * The doc website is the canonical home for docs, so links are rewritten
 * to internal Docusaurus paths whenever a mapping exists; references to
 * source code, ad-hoc YAML files, or anything else not surfaced on the
 * site have their link wrapper stripped and only the link text is kept.
 *
 * Run once when cutting the v0.3.0 release; subsequent edits to the
 * snapshot should be made directly in versioned_docs/version-0.3.0/.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKARDI = '/Users/weixin/workspace/skardi';
const DEST = join(__dirname, '../versioned_docs/version-0.3.0');

// Maps a normalized source path (relative to skardi root, no leading ./)
// to an internal Docusaurus URL. Entries with trailing /README.md and the
// directory form both resolve to the same destination.
const DOC_MAP = {
  'README.md': '/docs/intro',
  'docs/cli.md': '/docs/cli',
  'docs/server.md': '/docs/server',
  'docs/pipelines.md': '/docs/pipelines',
  'docs/jobs.md': '/docs/jobs',
  'docs/spark_for_agents.md': '/docs/spark-for-agents',
  'docs/postgres/README.md': '/docs/data-sources/postgres',
  'docs/postgres': '/docs/data-sources/postgres',
  'docs/mysql/README.md': '/docs/data-sources/mysql',
  'docs/mysql': '/docs/data-sources/mysql',
  'docs/sqlite/README.md': '/docs/data-sources/sqlite',
  'docs/sqlite': '/docs/data-sources/sqlite',
  'docs/mongo/README.md': '/docs/data-sources/mongo',
  'docs/mongo': '/docs/data-sources/mongo',
  'docs/redis/README.md': '/docs/data-sources/redis',
  'docs/redis': '/docs/data-sources/redis',
  'docs/seekdb/README.md': '/docs/data-sources/seekdb',
  'docs/seekdb': '/docs/data-sources/seekdb',
  'docs/iceberg/README.md': '/docs/data-sources/iceberg',
  'docs/iceberg': '/docs/data-sources/iceberg',
  'docs/lance/README.md': '/docs/data-sources/lance',
  'docs/lance': '/docs/data-sources/lance',
  'docs/S3_USAGE.md': '/docs/data-sources/s3',
  'docs/federated-queries.md': '/docs/features/federated-queries',
  'docs/catalog.md': '/docs/features/catalog',
  'docs/onnx_predict.md': '/docs/features/onnx-inference',
  'docs/observability.md': '/docs/features/observability',
  'docs/auth/README.md': '/docs/features/auth',
  'docs/auth': '/docs/features/auth',
  'docs/embeddings/README.md': '/docs/features/embeddings/overview',
  'docs/embeddings': '/docs/features/embeddings/overview',
  'docs/embeddings/candle/README.md': '/docs/features/embeddings/candle',
  'docs/embeddings/candle': '/docs/features/embeddings/candle',
  'docs/embeddings/gguf/README.md': '/docs/features/embeddings/gguf',
  'docs/embeddings/gguf': '/docs/features/embeddings/gguf',
  'docs/embeddings/remote/README.md': '/docs/features/embeddings/remote',
  'docs/embeddings/remote': '/docs/features/embeddings/remote',
  'demo/simple_backend/README.md': '/docs/demos/simple-backend',
  'demo/simple_backend': '/docs/demos/simple-backend',
  'demo/llm_wiki/README.md': '/docs/demos/llm-wiki',
  'demo/llm_wiki': '/docs/demos/llm-wiki',
  'demo/rag/README.md': '/docs/demos/rag',
  'demo/rag': '/docs/demos/rag',
  'demo/movie_recommendation/README.md': '/docs/demos/movie-recommendation',
  'demo/movie_recommendation': '/docs/demos/movie-recommendation',
};

// Asset paths copied into website/static/img/ — see snapshot README.
const ASSET_MAP = {
  'asset/logo.png': '/skardi-docs/img/skardi-logo.png',
  'asset/architecture.png': '/skardi-docs/img/skardi-architecture.png',
};

function resolveRelative(baseDir, rel) {
  rel = rel.replace(/^\.\//, '');
  // Strip a query/fragment for mapping purposes.
  const [pathOnly, suffix = ''] = rel.split(/(?=[?#])/, 2);
  const parts = baseDir === '.' ? [] : baseDir.split('/').filter(Boolean);
  let r = pathOnly;
  while (r.startsWith('../')) {
    parts.pop();
    r = r.slice(3);
  }
  const joined = [...parts, r].filter(Boolean).join('/').replace(/^\/+/, '');
  return { path: joined, suffix };
}

function lookupDoc(normalized) {
  if (DOC_MAP[normalized]) return DOC_MAP[normalized];
  // Try without trailing slash
  const noslash = normalized.replace(/\/$/, '');
  if (DOC_MAP[noslash]) return DOC_MAP[noslash];
  return null;
}

// Rewrite markdown links and inline HTML images. Resolves each relative
// target against the source file's directory, then either:
//   - rewrites it to a Docusaurus-internal path (DOC_MAP / ASSET_MAP), or
//   - drops the link wrapper and keeps only the visible text.
// Absolute URLs and bare anchors are left alone.
function rewriteContent(content, sourceDir) {
  // Reference-style link definitions [foo]: relative — drop them outright
  // when relative; keep absolute ones untouched.
  content = content.replace(
    /^\[([^\]]+)\]:\s*(?!https?:\/\/)(?!#)([^\s]+).*$/gm,
    '',
  );

  // ![alt](relative) — image
  content = content.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)(?!#)([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, alt, href) => {
      const { path } = resolveRelative(sourceDir, href);
      const asset = ASSET_MAP[path];
      if (asset) return `![${alt}](${asset})`;
      // Unmapped image — drop it entirely (no broken refs)
      return '';
    },
  );

  // [text](relative) — link
  content = content.replace(
    /\[([^\]]+)\]\((?!https?:\/\/)(?!#)([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, text, href) => {
      const { path, suffix } = resolveRelative(sourceDir, href);
      const mapped = lookupDoc(path);
      if (mapped) return `[${text}](${mapped}${suffix})`;
      // Unmapped (source code, raw yaml, etc.) — drop link, keep text
      return text;
    },
  );

  // <img src="relative"> — rewrite or drop
  content = content.replace(
    /<img\s+([^>]*?)src=["'](?!https?:\/\/)([^"']+)["']([^>]*?)\/?>/g,
    (_, before, src, after) => {
      const { path } = resolveRelative(sourceDir, src);
      const asset = ASSET_MAP[path];
      if (!asset) return '';
      const cleanedAfter = after.trim().replace(/\/$/, '').trim();
      const beforeTrim = before.trim();
      return `<img ${beforeTrim ? beforeTrim + ' ' : ''}src="${asset}"${cleanedAfter ? ' ' + cleanedAfter : ''} />`;
    },
  );

  // <source src=... /> — drop entirely (only used in <picture> in README,
  // and we don't ship the picture section).
  content = content.replace(/<source\s+[^>]*\/?>(?:\s*<\/source>)?/g, '');

  // README bare anchors don't exist on the split-up doc pages. Rewrite the
  // known ones to the correct destination page + anchor. Only matches
  // parenthesized-link form `](#anchor)`.
  const BARE_ANCHOR_FIXUPS = {
    '#building-from-source': '/docs/docker#building-from-source',
    '#supported-data-sources': '/docs/data-sources/overview',
    '#roadmap': '/docs/roadmap',
    '#public-roadmap': '/docs/roadmap',
    '#demo--examples': '/docs/demos/overview',
    '#docker': '/docs/docker',
    '#quick-start': '/docs/quick-start',
    '#cloud-sealos': '/docs/docker#cloud-sealos',
  };
  content = content.replace(/\]\((#[^)\s]+)\)/g, (m, anchor) =>
    BARE_ANCHOR_FIXUPS[anchor] ? `](${BARE_ANCHOR_FIXUPS[anchor]})` : m,
  );

  // `/docs/intro#public-roadmap` came out of `../README.md#public-roadmap` —
  // the roadmap now lives on its own page.
  content = content.replace(
    /\(\/docs\/intro#public-roadmap\)/g,
    '(/docs/roadmap)',
  );

  // <details>/<summary> wrappers in README are fine as raw HTML in MDX,
  // but keep their inner markdown untouched by letting the rest of the
  // pipeline run over the whole file.

  return content;
}

function readSource(absPath) {
  return readFileSync(absPath, 'utf8');
}

function write(relPath, frontmatter, body) {
  const full = join(DEST, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `---\n${frontmatter}\n---\n\n${body.trim()}\n`);
  console.log(`  wrote ${relPath}`);
}

function writeRaw(relPath, body) {
  const full = join(DEST, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, body);
  console.log(`  wrote ${relPath}`);
}

function loadAndTransform(relSourcePath, { stripTopHeading = true } = {}) {
  const abs = join(SKARDI, relSourcePath);
  let content = readSource(abs);
  content = rewriteContent(content, dirname(relSourcePath));
  if (stripTopHeading) {
    content = content.replace(/^#\s+[^\n]+\n+/, '');
  }
  return content;
}

// ---------- Parse README.md into named sections ----------
const README = readSource(join(SKARDI, 'README.md'));
const sections = {};
{
  let heading = null;
  let lines = [];
  for (const line of README.split('\n')) {
    if (line.startsWith('## ')) {
      if (heading) sections[heading] = lines.join('\n').trimEnd();
      heading = line.slice(3).trim();
      lines = [];
    } else if (heading) {
      lines.push(line);
    }
  }
  if (heading) sections[heading] = lines.join('\n').trimEnd();
}

// Intro: everything before first ##, with the badges/HTML block stripped
const intro = README.split(/\n## /)[0]
  .replace(/<div[\s\S]*?<\/div>/gi, '')
  .replace(/<hr\s*\/?>/gi, '')
  .trimStart()
  .trimEnd();

// Inside any `## Section`, horizontal rules `---` become markdown h2s when
// rendered as MDX inline. Strip them here so the snapshot doesn't carry
// stray dividers in the middle of a section.
function stripDividers(text) {
  return text
    .replace(/^\s*---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function section(name) {
  const body = sections[name] ?? '';
  return stripDividers(rewriteContent(body, '.'));
}

// ---------- Reset destination ----------
rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });

// ---------- Top-level pages ----------
// Intro: "What is Skardi?" + "Why Spark for Agents?" + Architecture +
// "What's already in the box" from the README. Full narrative lives at
// /docs/spark-for-agents.
write(
  'intro.md',
  'sidebar_position: 1\nslug: /intro\ntitle: Intro',
  [
    '# Skardi',
    '',
    '<p align="center"><img src="/skardi-docs/img/skardi-logo.png" alt="Skardi" width="600" /></p>',
    '',
    '## What is Skardi?',
    '',
    section('What is Skardi?'),
    '',
    '## Why "Spark for Agents"?',
    '',
    section('Why "Spark for Agents"?'),
    '',
    '## Architecture',
    '',
    '<p align="center"><img src="/skardi-docs/img/skardi-architecture.png" alt="Skardi Architecture" width="800" /></p>',
    '',
    "## What's already in the box",
    '',
    section("What's already in the box"),
  ].join('\n'),
);

write(
  'quick-start.md',
  'sidebar_position: 2\ntitle: Quick Start',
  `# Quick Start\n\n${section('Quick Start')}\n\n## Next Steps\n\n- [Skardi CLI](/docs/cli) — the full CLI reference.\n- [Skardi Server](/docs/server) — running the server and its HTTP surface.\n- [Pipelines](/docs/pipelines) — the online-serving primitive.\n- [Jobs](/docs/jobs) — the offline-batch peer.`,
);

write(
  'cli.md',
  'sidebar_position: 3\ntitle: Skardi CLI',
  `# Skardi CLI\n\n${loadAndTransform('docs/cli.md')}`,
);

write(
  'server.md',
  'sidebar_position: 4\ntitle: Skardi Server',
  `# Skardi Server\n\n${loadAndTransform('docs/server.md')}`,
);

write(
  'pipelines.md',
  'sidebar_position: 5\ntitle: Pipelines',
  `# Pipelines\n\n${loadAndTransform('docs/pipelines.md')}`,
);

write(
  'jobs.md',
  'sidebar_position: 6\ntitle: Offline Jobs',
  `# Offline Jobs\n\n${loadAndTransform('docs/jobs.md')}`,
);

write(
  'spark-for-agents.md',
  'sidebar_position: 7\ntitle: Spark for Agents',
  `# Spark for Agents\n\n${loadAndTransform('docs/spark_for_agents.md')}`,
);

write(
  'docker.md',
  'sidebar_position: 11\ntitle: Docker & Deployment',
  `# Docker & Deployment\n\n## Docker\n\n${section('Docker')}\n\n## Cloud (Sealos)\n\n${section('Cloud (Sealos)')}\n\n## Building from Source\n\n${section('Building from Source')}`,
);

write(
  'roadmap.md',
  'sidebar_position: 12\ntitle: Roadmap',
  `# Roadmap\n\n${section('Roadmap')}`,
);

// Sidebar order for autogenerated category folders: data-sources → features → demos
writeRaw('data-sources/_category_.json', JSON.stringify({ label: 'Data Sources', position: 8 }, null, 2) + '\n');
writeRaw('features/_category_.json', JSON.stringify({ label: 'Features', position: 9 }, null, 2) + '\n');
writeRaw('demos/_category_.json', JSON.stringify({ label: 'Demos', position: 10 }, null, 2) + '\n');

// ---------- Data Sources ----------
write(
  'data-sources/overview.md',
  'sidebar_position: 1\ntitle: Overview',
  `# Supported Data Sources\n\n${section('Supported Data Sources')}`,
);

const dataSources = [
  ['postgres', 'PostgreSQL', 'docs/postgres/README.md'],
  ['mysql', 'MySQL', 'docs/mysql/README.md'],
  ['sqlite', 'SQLite', 'docs/sqlite/README.md'],
  ['mongo', 'MongoDB', 'docs/mongo/README.md'],
  ['redis', 'Redis', 'docs/redis/README.md'],
  ['seekdb', 'SeekDB', 'docs/seekdb/README.md'],
  ['iceberg', 'Apache Iceberg', 'docs/iceberg/README.md'],
  ['lance', 'Lance', 'docs/lance/README.md'],
];
dataSources.forEach(([slug, title, src], i) => {
  write(
    `data-sources/${slug}.md`,
    `sidebar_position: ${i + 2}\ntitle: ${title}`,
    `# ${title}\n\n${loadAndTransform(src)}`,
  );
});

write(
  'data-sources/s3.md',
  `sidebar_position: ${dataSources.length + 2}\ntitle: S3 / Object Stores`,
  `# S3 and Object Stores\n\n${loadAndTransform('docs/S3_USAGE.md')}`,
);

// ---------- Features ----------
// Embeddings is a nested category written below at sidebar_position 3,
// so leave a gap there in the flat feature pages.
const features = [
  ['federated-queries', 'Federated Queries', 'docs/federated-queries.md', 1],
  ['catalog', 'Catalog Mode', 'docs/catalog.md', 2],
  ['onnx-inference', 'ONNX Inference', 'docs/onnx_predict.md', 4],
  ['observability', 'Observability', 'docs/observability.md', 5],
  ['auth', 'Authentication', 'docs/auth/README.md', 6],
];
features.forEach(([slug, title, src, pos]) => {
  write(
    `features/${slug}.md`,
    `sidebar_position: ${pos}\ntitle: ${title}`,
    `# ${title}\n\n${loadAndTransform(src)}`,
  );
});

// Embeddings: nested category under Features
writeRaw('features/embeddings/_category_.json', JSON.stringify({ label: 'Embeddings', position: 3 }, null, 2) + '\n');
write(
  'features/embeddings/overview.md',
  'sidebar_position: 1\ntitle: Overview',
  `# Embedding Inference\n\n${loadAndTransform('docs/embeddings/README.md')}`,
);
const embeddings = [
  ['candle', 'Candle (local SafeTensors)', 'docs/embeddings/candle/README.md'],
  ['gguf', 'GGUF (llama.cpp)', 'docs/embeddings/gguf/README.md'],
  ['remote', 'Remote APIs', 'docs/embeddings/remote/README.md'],
];
embeddings.forEach(([slug, title, src], i) => {
  write(
    `features/embeddings/${slug}.md`,
    `sidebar_position: ${i + 2}\ntitle: ${title}`,
    `# ${title}\n\n${loadAndTransform(src)}`,
  );
});

// ---------- Demos ----------
write(
  'demos/overview.md',
  'sidebar_position: 1\ntitle: Overview',
  `# Demos & Examples\n\n${section('Demo & Examples')}`,
);

const demos = [
  ['simple-backend', 'Simple Backend', 'demo/simple_backend/README.md'],
  ['llm-wiki', 'LLM Wiki Q&A', 'demo/llm_wiki/README.md'],
  ['rag', 'RAG Pipeline', 'demo/rag/README.md'],
  ['movie-recommendation', 'Movie Recommendation', 'demo/movie_recommendation/README.md'],
];
demos.forEach(([slug, title, src], i) => {
  write(
    `demos/${slug}.md`,
    `sidebar_position: ${i + 2}\ntitle: ${title}`,
    `# ${title}\n\n${loadAndTransform(src)}`,
  );
});

console.log(`\nSnapshot written to ${DEST}`);
