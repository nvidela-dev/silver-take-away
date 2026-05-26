import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const docsPath = resolve(root, 'docs');
const planPath = resolve(docsPath, 'PR-PLAN.md');
const checklistPath = resolve(docsPath, 'CHECKLIST.md');
const outputPath = resolve(docsPath, 'PR-PLAN.visual.html');
const browserHostOutputPath = '/private/tmp/codex-pr-explain/index.html';

const planMd = readFileSync(planPath, 'utf8');
const checklistMd = readFileSync(checklistPath, 'utf8');

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const renderInline = (value) =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

const statusMap = new Map();
for (const match of checklistMd.matchAll(/^## (PR-\d+): .* \[(READY|BLOCKED|IN PROGRESS|DONE)\]$/gm)) {
  statusMap.set(match[1], match[2]);
}

const statusStyles = {
  DONE: {
    badge: 'bg-emerald-100 text-emerald-900',
    border: 'border-emerald-300',
    soft: 'bg-emerald-50',
  },
  READY: {
    badge: 'bg-sky-100 text-sky-900',
    border: 'border-sky-300',
    soft: 'bg-sky-50',
  },
  BLOCKED: {
    badge: 'bg-amber-100 text-amber-900',
    border: 'border-amber-300',
    soft: 'bg-amber-50',
  },
  'IN PROGRESS': {
    badge: 'bg-violet-100 text-violet-900',
    border: 'border-violet-300',
    soft: 'bg-violet-50',
  },
  DEFAULT: {
    badge: 'bg-slate-100 text-slate-800',
    border: 'border-slate-300',
    soft: 'bg-slate-50',
  },
};

const extractBlock = (source, title) => {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockRegex = new RegExp(`\\*\\*${escaped}\\*\\*\\n([\\s\\S]*?)(?=\\n\\*\\*|\\n---|$)`);
  const block = source.match(blockRegex);
  if (!block) {
    return [];
  }
  return block[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim());
};

const headingMatches = [...planMd.matchAll(/^## (PR-\d+): (.+)$/gm)];
const prEntries = headingMatches.map((match, index) => {
  const start = match.index + match[0].length;
  const end = index + 1 < headingMatches.length ? headingMatches[index + 1].index : planMd.length;
  const section = planMd.slice(start, end);

  return {
    pr: match[1],
    title: match[2].trim(),
    status: statusMap.get(match[1]) ?? 'BLOCKED',
    objective: extractBlock(section, 'Objective')[0] ?? '',
    mustShip: extractBlock(section, 'Must Ship'),
    outOfScope: extractBlock(section, 'Out of Scope'),
    dependencies: extractBlock(section, 'Dependencies'),
    gates: extractBlock(section, 'Acceptance Gates'),
    effort: extractBlock(section, 'Estimated Effort')[0] ?? 'Medium',
  };
});

const sequenceMatch = planMd.match(
  /## Backlog Sequence \(No Time Windows\)\n\n([\s\S]*?)(?=\n---|\n## )/m,
);
const sequenceItems = (sequenceMatch?.[1] ?? '')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => /^\d+\./.test(line))
  .map((line) => {
    const parsed = line.match(/^\d+\.\s+`(PR-\d+)`\s+(.+)$/);
    if (!parsed) {
      return null;
    }
    return { pr: parsed[1], label: parsed[2] };
  })
  .filter(Boolean);

const mainCards = prEntries.filter((entry) => ['PR-1', 'PR-2', 'PR-3'].includes(entry.pr));
const upcomingCards = prEntries.filter((entry) => !['PR-1', 'PR-2', 'PR-3'].includes(entry.pr));

const renderList = (items) =>
  items
    .map(
      (item) =>
        `<li class="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">${renderInline(item)}</li>`,
    )
    .join('\n');

const renderGates = (items) =>
  items
    .map(
      (item) =>
        `<li class="border-l-2 border-slate-300 pl-3 text-sm text-slate-700">${renderInline(item)}</li>`,
    )
    .join('\n');

const renderMainCard = (entry) => {
  const statusStyle = statusStyles[entry.status] ?? statusStyles.DEFAULT;
  return `
      <article class="rounded-lg border ${statusStyle.border} bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-lg font-semibold text-slate-900">${escapeHtml(entry.pr)}: ${escapeHtml(entry.title)}</h3>
          <span class="rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyle.badge}">${escapeHtml(entry.status)}</span>
        </div>
        <p class="mt-3 text-sm text-slate-700"><span class="font-semibold text-slate-900">Objective:</span> ${renderInline(entry.objective)}</p>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">Must Ship</p>
            <ul class="mt-2 space-y-2">${renderList(entry.mustShip)}</ul>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">Out of Scope</p>
            <ul class="mt-2 space-y-2">${renderList(entry.outOfScope)}</ul>
          </div>
        </div>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">Dependencies</p>
            <ul class="mt-2 space-y-2">${renderList(entry.dependencies)}</ul>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">Estimated Effort</p>
            <p class="mt-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">${renderInline(entry.effort)}</p>
          </div>
        </div>
        <div class="mt-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">Acceptance Gates</p>
          <ul class="mt-2 space-y-2">${renderGates(entry.gates)}</ul>
        </div>
      </article>
    `;
};

const renderUpcomingCard = (entry) => {
  const statusStyle = statusStyles[entry.status] ?? statusStyles.DEFAULT;
  return `
      <article class="rounded-lg border ${statusStyle.border} bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-2">
          <h4 class="text-base font-semibold text-slate-900">${escapeHtml(entry.pr)}: ${escapeHtml(entry.title)}</h4>
          <span class="rounded-md px-2 py-1 text-[11px] font-semibold ${statusStyle.badge}">${escapeHtml(entry.status)}</span>
        </div>
        <p class="mt-2 text-sm text-slate-700">${renderInline(entry.objective)}</p>
        <p class="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Depends on ${renderInline(entry.dependencies[0] ?? 'Previous PR')}</p>
      </article>
    `;
};

const sequenceHtml = sequenceItems
  .map((item, index) => {
    const isLast = index === sequenceItems.length - 1;
    const status = statusMap.get(item.pr) ?? 'BLOCKED';
    const statusStyle = statusStyles[status] ?? statusStyles.DEFAULT;

    return `
      <div class="flex items-center gap-2">
        <div class="flex min-w-0 items-center gap-2 rounded-lg border ${statusStyle.border} ${statusStyle.soft} px-3 py-2">
          <span class="text-xs font-bold text-slate-700">${escapeHtml(item.pr)}</span>
          <span class="truncate text-sm font-medium text-slate-800">${escapeHtml(item.label)}</span>
        </div>
        ${isLast ? '' : '<span class="text-slate-400">→</span>'}
      </div>
    `;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bill Pay MVP — PR Plan Visual</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-100 text-slate-900 antialiased">
  <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <header class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Bill Pay MVP</p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-900">PR Plan Visual</h1>
      <p class="mt-2 max-w-4xl text-sm text-slate-600">Single-source view generated from <code>docs/PR-PLAN.md</code> and <code>docs/CHECKLIST.md</code>. No time-based planning; sequence is review-driven.</p>
      <div class="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span class="rounded-md bg-emerald-100 px-2.5 py-1 text-emerald-900">DONE</span>
        <span class="rounded-md bg-sky-100 px-2.5 py-1 text-sky-900">READY</span>
        <span class="rounded-md bg-amber-100 px-2.5 py-1 text-amber-900">BLOCKED</span>
        <span class="rounded-md bg-violet-100 px-2.5 py-1 text-violet-900">IN PROGRESS</span>
      </div>
    </header>

    <section class="mt-6 grid gap-4 md:grid-cols-3">
      <article class="rounded-lg border border-emerald-300 bg-emerald-50 p-4 shadow-sm">
        <h2 class="text-base font-semibold text-emerald-900">Baseline</h2>
        <p class="mt-2 text-sm text-emerald-900"><code>PR-0</code> is merged and locked. Remaining PRs are active backlog.</p>
      </article>
      <article class="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <h2 class="text-base font-semibold text-slate-900">Planning Rule</h2>
        <p class="mt-2 text-sm text-slate-700">No day/week windows. Work advances by mergeable PR slices only.</p>
      </article>
      <article class="rounded-lg border border-violet-300 bg-violet-50 p-4 shadow-sm">
        <h2 class="text-base font-semibold text-violet-900">Feature Gate</h2>
        <p class="mt-2 text-sm text-violet-900"><code>PR-3</code> is the required minimal Clerk + NeonDB integration checkpoint before feature work.</p>
      </article>
    </section>

    <section class="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-900">Backlog Sequence</h2>
      <div class="mt-4 flex flex-wrap items-center gap-2">
${sequenceHtml}
      </div>
    </section>

    <section class="mt-6">
      <h2 class="text-lg font-semibold text-slate-900">Current Execution PRs</h2>
      <div class="mt-4 space-y-4">
${mainCards.map((entry) => renderMainCard(entry)).join('\n')}
      </div>
    </section>

    <section class="mt-6">
      <h2 class="text-lg font-semibold text-slate-900">Upcoming PRs</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
${upcomingCards.map((entry) => renderUpcomingCard(entry)).join('\n')}
      </div>
    </section>
  </main>
</body>
</html>
`;

writeFileSync(outputPath, html);
console.log(`Generated ${outputPath}`);

if (existsSync('/private/tmp/codex-pr-explain')) {
  writeFileSync(browserHostOutputPath, html);
  console.log(`Published ${browserHostOutputPath}`);
}
