let apiKeyPatterns = {};

const piiPatterns = {
  ssn: [/\b\d{3}-\d{2}-\d{4}\b/g],
  credit_card: [/\b\d{13,16}\b/g],
  email: [/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g],
  phone: [
    /\b\+?1?\s?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    /\b\+[0-9]{1,3}\s?[0-9\s\-()]{7,14}\b/g
  ],
  bitcoin_address: [/\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g, /\bbc1[a-z0-9]{39,59}\b/g],
  ethereum_address: [/\b0x[a-fA-F0-9]{40}\b/g],
  iban: [/\b[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}\b/g]
};

const logSecretPatterns = {
  http_auth: [
    /\bBearer\s+[A-Za-z0-9._\-+/=]{8,}\b/g,
    /\bBasic\s+[A-Za-z0-9+/=]{8,}\b/g,
    /\b(?:authorization|x-api-key|api-key|api_key|token|secret|password|passwd|pwd|cookie|set-cookie)\s*[:=]\s*[^\s'"`]+/gi,
  ],
  url_credentials: [/\bhttps?:\/\/[^\s:@]+:[^\s@]+@[^\s]+/gi],
  jwt: [/\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
};

const DIFF_PLACEHOLDER =
  'Run “Sanitize Content” to compare original and sanitized side by side.\n\nYour text stays in this browser.';
const PROMPT_PLACEHOLDER =
  'Paste a log, then click “Build AI Prompt” to turn it into a compact prompt for debugging.';
const SAMPLE_LOG = `2026-04-03T06:31:12Z app[web.1]: Starting request batch
2026-04-03T06:31:13Z app[web.1]: ERROR Failed to connect to postgres: connection refused
2026-04-03T06:31:13Z app[web.1]: Caused by: dial tcp 10.0.2.15:5432: connect: connection refused
2026-04-03T06:31:13Z app[web.1]: Stacktrace:
2026-04-03T06:31:13Z app[web.1]:   at db/client.ts:42
2026-04-03T06:31:13Z app[web.1]:   at service/bootstrap.ts:18
2026-04-03T06:31:13Z app[web.1]: Authorization: Bearer sk-proj-fake-demo-token-000000000000
2026-04-03T06:31:14Z app[web.1]: pod restarted by kubelet`;

const promptInput = document.getElementById('promptInput');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const copySanitizedBtn = document.getElementById('copySanitizedBtn');
const fileInput = document.getElementById('fileInput');
const sampleBtn = document.getElementById('sampleBtn');
const findingsCount = document.getElementById('findingsCount');
const charsMetric = document.getElementById('charsMetric');
const tokensMetric = document.getElementById('tokensMetric');
const findingsList = document.getElementById('findingsList');
const statApiCount = document.getElementById('statApiCount');
const statPiiCount = document.getElementById('statPiiCount');
const statDone = document.getElementById('statDone');

const diffOriginal = document.getElementById('diffOriginal');
const diffSanitized = document.getElementById('diffSanitized');
const diffOriginalScroll = document.getElementById('diffOriginalScroll');
const diffSanitizedScroll = document.getElementById('diffSanitizedScroll');
const fullOriginal = document.getElementById('fullOriginal');
const fullSanitized = document.getElementById('fullSanitized');

const tabBtnDiff = document.getElementById('tabBtnDiff');
const tabBtnOriginal = document.getElementById('tabBtnOriginal');
const tabBtnSanitized = document.getElementById('tabBtnSanitized');
const panelDiff = document.getElementById('panelDiff');
const panelOriginal = document.getElementById('panelOriginal');
const panelSanitized = document.getElementById('panelSanitized');

const exportJsonBtn = document.getElementById('exportJsonBtn');
const copyFindingsReportBtn = document.getElementById('copyFindingsReportBtn');

const pruneApiKeysToggle = document.getElementById('pruneApiKeysToggle');
const redactPiiToggle = document.getElementById('redactPiiToggle');
const redactLogSecretsToggle = document.getElementById('redactLogSecretsToggle');
const genericSecretsToggle = document.getElementById('genericSecretsToggle');
const pasteBtn = document.getElementById('pasteBtn');
const inputLineCount = document.getElementById('inputLineCount');
const inputCharCount = document.getElementById('inputCharCount');
const auditPanel = document.getElementById('auditPanel');

const promptModeSelect = document.getElementById('promptModeSelect');
const contextLinesInput = document.getElementById('contextLinesInput');
const maxBlocksInput = document.getElementById('maxBlocksInput');
const promptFormatSelect = document.getElementById('promptFormatSelect');
const promptSummary = document.getElementById('promptSummary');
const promptInsightBar = document.getElementById('promptInsightBar');
const promptOutput = document.getElementById('promptOutput');
const buildPromptBtn = document.getElementById('buildPromptBtn');
const autoTuneBtn = document.getElementById('autoTuneBtn');
const copyPromptBtn = document.getElementById('copyPromptBtn');

let lastOriginal = '';
let lastSanitized = '';
let lastExportFindings = [];
let lastPromptText = '';
let lastPromptAnalysis = null;

const AUDIT_IDLE_HTML = `
  <div class="audit-placeholder">
    <div class="audit-icon" aria-hidden="true">&#128274;</div>
    <p class="audit-title">Awaiting input</p>
    <p class="audit-desc">Run <strong>Sanitize Content</strong> or <strong>Build AI Prompt</strong> to scan locally. Your data never leaves this browser window.</p>
  </div>
`;

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(String(value), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function getApiKeyPatternsForRun() {
  const p = { ...apiKeyPatterns };
  if (!genericSecretsToggle.checked) {
    delete p.generic;
  }
  return p;
}

function getRedactionPatterns() {
  const patterns = {};
  if (pruneApiKeysToggle.checked) {
    Object.assign(patterns, getApiKeyPatternsForRun());
  }
  if (redactPiiToggle.checked) {
    Object.assign(patterns, piiPatterns);
  }
  if (redactLogSecretsToggle.checked) {
    Object.assign(patterns, logSecretPatterns);
  }
  return patterns;
}

function updateInputMeta() {
  const text = promptInput.value || '';
  const lines = text ? text.split('\n').length : 0;
  inputLineCount.textContent = String(lines);
  inputCharCount.textContent = String(text.length);
}

function setAuditIdle() {
  auditPanel.innerHTML = AUDIT_IDLE_HTML;
}

function setAuditAfterRun(total, apiCount, piiCount) {
  auditPanel.innerHTML = `
    <div class="audit-summary">
      <p style="margin:0 0 0.5rem;"><strong>${total}</strong> finding${total === 1 ? '' : 's'}</p>
      <p style="margin:0;font-size:0.78rem;line-height:1.45;">
        API key patterns: <strong>${apiCount}</strong><br>
        PII / log secrets: <strong>${piiCount}</strong>
      </p>
    </div>
  `;
}

function setTab(name) {
  const map = [
    { id: 'diff', panel: panelDiff, btn: tabBtnDiff },
    { id: 'original', panel: panelOriginal, btn: tabBtnOriginal },
    { id: 'sanitized', panel: panelSanitized, btn: tabBtnSanitized },
  ];
  for (const { id, panel, btn } of map) {
    const on = id === name;
    panel.hidden = !on;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  }
}

function buildLineStarts(text) {
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') lineStarts.push(i + 1);
  }
  return lineStarts;
}

function indexToLineCol(lineStarts, index) {
  let low = 0;
  let high = lineStarts.length - 1;
  let lineIdx = 0;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lineStarts[mid] <= index) {
      lineIdx = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  const lineNumber = lineIdx + 1;
  const colNumber = index - lineStarts[lineIdx] + 1;
  return { lineNumber, colNumber };
}

function cloneRegex(regex) {
  return new RegExp(regex.source, regex.flags);
}

function compileApiKeyPatternsFromRules(rules) {
  const compiled = {};
  for (const [provider, providerRules] of Object.entries(rules || {})) {
    const patterns = [];
    for (const rule of providerRules || []) {
      if (!rule || !rule.regex) continue;
      try {
        const flags = provider === 'generic' ? 'gi' : 'g';
        patterns.push(new RegExp(rule.regex, flags));
      } catch (err) {
        console.error(`Invalid regex for provider ${provider}:`, rule.regex, err);
      }
    }
    if (patterns.length) {
      compiled[provider] = patterns;
    }
  }
  return compiled;
}

async function loadApiKeyPatterns() {
  const response = await fetch('./api_key_rules.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load api_key_rules.json (${response.status})`);
  }
  const rules = await response.json();
  apiKeyPatterns = compileApiKeyPatternsFromRules(rules);
}

function detectMatches(text, groupedPatterns, type) {
  const results = [];
  for (const [label, patterns] of Object.entries(groupedPatterns)) {
    for (const pattern of patterns) {
      const reg = cloneRegex(pattern);
      let match;
      while ((match = reg.exec(text)) !== null) {
        results.push({
          type,
          label,
          start: match.index,
          end: match.index + match[0].length,
          matched: match[0],
        });
        if (match.index === reg.lastIndex) reg.lastIndex += 1;
      }
    }
  }
  return results.sort((a, b) => a.start - b.start);
}

function redactText(text, findings) {
  if (!findings.length) return text;

  const merged = [];
  for (const item of findings) {
    const last = merged[merged.length - 1];
    if (!last || item.start > last.end) {
      merged.push({ ...item });
      continue;
    }
    if (item.end > last.end) {
      last.end = item.end;
      last.matched = text.slice(last.start, last.end);
    }
  }

  let cursor = 0;
  let out = '';
  for (const hit of merged) {
    out += text.slice(cursor, hit.start);
    const tag = hit.type === 'api_key' ? `API_KEY_${hit.label.toUpperCase()}` : hit.label.toUpperCase();
    out += `[${tag}]`;
    cursor = hit.end;
  }
  out += text.slice(cursor);
  return out;
}

function estimateTokens(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  return Math.max(0, Math.round(words * 1.3 + chars / 20));
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderFindings(apiFindings, piiFindings) {
  const all = [...apiFindings, ...piiFindings];
  findingsList.innerHTML = '';
  if (!all.length) {
    findingsList.innerHTML = '<div class="muted">No sensitive patterns detected.</div>';
    return;
  }

  for (const item of all.slice(0, 50)) {
    const snippet = item.matched.length > 80 ? `${item.matched.slice(0, 80)}…` : item.matched;
    const row = document.createElement('div');
    row.className = 'finding-card';
    const isApi = item.type === 'api_key';
    row.innerHTML = `
      <div class="finding-card-top">
        <span class="finding-badge ${isApi ? 'finding-badge-api' : 'finding-badge-pii'}">${isApi ? 'API' : 'PII'}</span>
        <span class="finding-line">Line ${item.lineNumber ?? '?'}:${item.colNumber ?? '?'}</span>
      </div>
      <div class="finding-label">${escapeHtml(String(item.label))}</div>
      <pre class="finding-snippet">${escapeHtml(snippet)}</pre>
    `;
    findingsList.appendChild(row);
  }
}

function mergeRanges(ranges) {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const out = [];
  let cur = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    if (n.start <= cur.end) {
      cur.end = Math.max(cur.end, n.end);
    } else {
      out.push(cur);
      cur = { ...n };
    }
  }
  out.push(cur);
  return out;
}

function collectOriginalHighlightRanges(input) {
  const ranges = [];
  if (!input) return ranges;
  if (pruneApiKeysToggle.checked) {
    const api = detectMatches(input, getApiKeyPatternsForRun(), 'api_key');
    for (const f of api) ranges.push({ start: f.start, end: f.end });
  }
  if (redactPiiToggle.checked) {
    const pii = detectMatches(input, piiPatterns, 'pii');
    for (const f of pii) ranges.push({ start: f.start, end: f.end });
  }
  if (redactLogSecretsToggle.checked) {
    const logSecrets = detectMatches(input, logSecretPatterns, 'pii');
    for (const f of logSecrets) ranges.push({ start: f.start, end: f.end });
  }
  return mergeRanges(ranges);
}

function collectPlaceholderRangesFromSanitized(text) {
  const ranges = [];
  if (!text) return ranges;
  const re = /\[(?:API_KEY_[A-Z0-9_]+|[A-Z][A-Z0-9_]*)\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }
  return mergeRanges(ranges);
}

function wrapHighlights(text, ranges, markClass) {
  if (!ranges.length) return escapeHtml(text);
  let html = '';
  let pos = 0;
  for (const r of ranges) {
    if (r.end <= r.start) continue;
    if (r.start > pos) html += escapeHtml(text.slice(pos, r.start));
    html += `<mark class="${markClass}">` + escapeHtml(text.slice(r.start, r.end)) + '</mark>';
    pos = r.end;
  }
  if (pos < text.length) html += escapeHtml(text.slice(pos));
  return html;
}

function resetDiffScroll() {
  if (diffOriginalScroll) diffOriginalScroll.scrollTop = 0;
  if (diffSanitizedScroll) diffSanitizedScroll.scrollTop = 0;
}

function setResultsViews(input, result) {
  lastOriginal = input;
  lastSanitized = result;
  const origRanges = collectOriginalHighlightRanges(input);
  const outRanges = collectPlaceholderRangesFromSanitized(result);
  const origHtml = wrapHighlights(input, origRanges, 'diff-hit-src');
  const outHtml = wrapHighlights(result, outRanges, 'diff-hit-out');
  diffOriginal.innerHTML = origHtml;
  diffSanitized.innerHTML = outHtml;
  fullOriginal.innerHTML = origHtml;
  fullSanitized.innerHTML = outHtml;
  resetDiffScroll();
}

function setDiffPlaceholder() {
  lastOriginal = '';
  lastSanitized = '';
  diffOriginal.textContent = DIFF_PLACEHOLDER;
  diffSanitized.textContent = '';
  fullOriginal.textContent = '';
  fullSanitized.textContent = '';
  resetDiffScroll();
}

function setPromptPlaceholder() {
  lastPromptText = '';
  lastPromptAnalysis = null;
  promptSummary.innerHTML = 'Paste a log and hit <strong>Build AI Prompt</strong>.';
  promptOutput.textContent = PROMPT_PLACEHOLDER;
  renderPromptInsights(detectPromptProfile(''), false);
}

function setupDiffScrollSync() {
  if (!diffOriginalScroll || !diffSanitizedScroll) return;
  let syncing = false;
  const sync = (from, to) => {
    if (syncing) return;
    const maxFrom = from.scrollHeight - from.clientHeight;
    const maxTo = to.scrollHeight - to.clientHeight;
    syncing = true;
    if (maxFrom <= 0 || maxTo <= 0) {
      to.scrollTop = from.scrollTop;
    } else {
      const ratio = from.scrollTop / maxFrom;
      to.scrollTop = Math.round(ratio * maxTo);
    }
    requestAnimationFrame(() => {
      syncing = false;
    });
  };
  diffOriginalScroll.addEventListener('scroll', () => sync(diffOriginalScroll, diffSanitizedScroll), {
    passive: true,
  });
  diffSanitizedScroll.addEventListener('scroll', () => sync(diffSanitizedScroll, diffOriginalScroll), {
    passive: true,
  });
}

function makeDetectAndRedactStep({ enabledEl, patterns, type }) {
  return {
    enabled: () => !!enabledEl.checked,
    run: (text) => {
      const lineStarts = buildLineStarts(text);
      const findings = detectMatches(text, patterns, type);
      const enrichedFindings = findings.map((f) => {
        const { lineNumber, colNumber } = indexToLineCol(lineStarts, f.start);
        return { ...f, lineNumber, colNumber };
      });
      const redacted = redactText(text, findings);
      return { text: redacted, findings: enrichedFindings };
    },
  };
}

function processTextWithActiveRedaction(input) {
  const redactedFindings = [];
  const steps = [
    makeDetectAndRedactStep({
      enabledEl: pruneApiKeysToggle,
      patterns: getApiKeyPatternsForRun(),
      type: 'api_key',
    }),
    makeDetectAndRedactStep({
      enabledEl: redactPiiToggle,
      patterns: piiPatterns,
      type: 'pii',
    }),
    makeDetectAndRedactStep({
      enabledEl: redactLogSecretsToggle,
      patterns: logSecretPatterns,
      type: 'pii',
    }),
  ];

  let result = input;
  for (const step of steps) {
    if (!step.enabled()) continue;
    const stepResult = step.run(result);
    result = stepResult.text;
    redactedFindings.push(...stepResult.findings);
  }

  const apiFindings = redactedFindings.filter((f) => f.type === 'api_key');
  const piiFindings = redactedFindings.filter((f) => f.type === 'pii');
  const allFindings = redactedFindings.sort((a, b) => a.start - b.start);

  return {
    text: result,
    apiFindings,
    piiFindings,
    allFindings,
    exportFindings: allFindings.map(({ type, label, start, end, matched, lineNumber, colNumber }) => ({
      type,
      label,
      start,
      end,
      matched,
      lineNumber,
      colNumber,
    })),
  };
}

function processPrompt() {
  const input = promptInput.value || '';
  const result = processTextWithActiveRedaction(input);

  lastExportFindings = result.exportFindings;
  setResultsViews(input, result.text);
  findingsCount.textContent = String(result.allFindings.length);
  charsMetric.textContent = `${input.length} → ${result.text.length}`;
  tokensMetric.textContent = `${estimateTokens(input)} → ${estimateTokens(result.text)}`;
  statApiCount.textContent = String(result.apiFindings.length);
  statPiiCount.textContent = String(result.piiFindings.length);
  statDone.textContent = !result.allFindings.length && input === result.text ? 'No sensitive data detected' : 'Done';

  renderFindings(result.apiFindings, result.piiFindings);
  setAuditAfterRun(result.allFindings.length, result.apiFindings.length, result.piiFindings.length);
  setTab('diff');
}

const LOG_SIGNAL_PATTERNS = [
  /(?:^|\b)(error|fatal|panic|exception|traceback|uncaught|failed|failure|crash|segmentation fault|out of memory|oom|assertion failed)\b/i,
  /^\s*caused by:/i,
  /^\s*panic:/i,
  /^\s*traceback \(most recent call last\):/i,
  /^\s*exception in thread/i,
  /^\s*fatal error:/i,
  /^\s*error:/i,
];

const LOG_CONTINUATION_PATTERNS = [
  /^\s+at\s+/i,
  /^\s*File\s+"/i,
  /^\s*\.\.\.\s+\d+\s+more\b/i,
  /^\s*Suppressed:/i,
  /^\s*Caused by:/i,
  /^\s*During handling of the above exception/i,
  /^\s*The above exception was the direct cause/i,
  /^\s*\w*Traceback/i,
];

function stripAnsi(text) {
  return text.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
}

function normalizeLogLine(line) {
  const clean = stripAnsi(String(line)).replace(/\s+$/g, '');
  return clean.replace(/\s{2,}/g, ' ');
}

function truncateLine(line, max = 220) {
  if (line.length <= max) return line;
  return `${line.slice(0, max - 1)}…`;
}

function isSignalLine(line) {
  return LOG_SIGNAL_PATTERNS.some((re) => re.test(line));
}

function isContinuationLine(line) {
  if (!line) return false;
  return LOG_CONTINUATION_PATTERNS.some((re) => re.test(line)) || /^\s{2,}\S/.test(line);
}

function severityScore(line) {
  const lower = line.toLowerCase();
  if (/(panic|fatal error|segmentation fault|out of memory|oom|traceback)/i.test(lower)) return 4;
  if (/(caused by|exception|uncaught|crash)/i.test(lower)) return 3;
  if (/(error|failed|failure)/i.test(lower)) return 2;
  return 1;
}

function extractEnvironmentHints(text) {
  const hints = [];
  const add = (label) => {
    if (!hints.includes(label)) hints.push(label);
  };

  const tests = [
    [/\bdocker\b|\bcontainer\b|\bimage\b/i, 'Container / Docker'],
    [/\bkubernetes\b|\bk8s\b|\bpod\b|\bdeployment\b|\bnamespace\b/i, 'Kubernetes'],
    [/\bnode(?:\.js)?\b|\bpnpm\b|\bnpm\b|\byarn\b/i, 'Node.js toolchain'],
    [/\bpython\b|\bpip\b|\bpoetry\b|\bvenv\b/i, 'Python toolchain'],
    [/\bjava\b|\bjvm\b|\bspring\b|\bmaven\b|\bgradle\b/i, 'Java / JVM'],
    [/\bgo\b|\bgoroutine\b|\bgo version\b/i, 'Go'],
    [/\brust\b|\bcargo\b/i, 'Rust'],
    [/\blinux\b|\balpine\b|\bubuntu\b|\bdebian\b/i, 'Linux / base image'],
    [/\bpostgres(?:ql)?\b|\bmysql\b|\bmongo(?:db)?\b|\bredis\b|\bkafka\b|\belasticsearch\b/i, 'Backend / datastore'],
    [/\bhttp(?:s)?\b|\bgrpc\b|\baxios\b|\bfetch\b/i, 'Network / API call'],
  ];

  for (const [re, label] of tests) {
    if (re.test(text)) add(label);
  }

  return hints;
}

function detectPromptProfile(text) {
  const envHints = extractEnvironmentHints(text);
  const lower = text.toLowerCase();
  const signals = [];
  let mode = 'debug';
  let contextLines = 3;
  let maxBlocks = 4;

  const addSignal = (label) => {
    if (!signals.includes(label)) signals.push(label);
  };

  if (/traceback \(most recent call last\)|caused by|exception|uncaught|stacktrace|stack trace/i.test(text)) {
    addSignal('stack trace');
    contextLines = 4;
    maxBlocks = 5;
  }
  if (/panic|fatal error|segmentation fault|out of memory|oom/i.test(text)) {
    addSignal('crash');
    contextLines = 5;
    maxBlocks = 4;
  }
  if (/connection refused|timeout|timed out|502|503|504|bad gateway|dns|tls|ssl/i.test(lower)) {
    addSignal('network / transport');
    mode = 'bug';
  }
  if (/kubernetes|k8s|pod|container|docker/i.test(lower)) {
    addSignal('container / k8s');
  }
  if (/migration|sql|postgres|mysql|sqlite|redis|mongo/i.test(lower)) {
    addSignal('data / datastore');
    mode = mode === 'debug' ? 'summary' : mode;
  }
  if (/build failed|compile error|module not found|import error|syntaxerror/i.test(lower)) {
    addSignal('build / compile');
    mode = 'debug';
    contextLines = 4;
  }

  const confidenceScore = signals.length + envHints.length;
  const confidence = confidenceScore >= 4 ? 'high' : confidenceScore >= 2 ? 'medium' : 'low';

  return {
    mode,
    contextLines,
    maxBlocks,
    signals,
    envHints,
    confidence,
    title:
      signals[0] === 'stack trace'
        ? 'Traceback detected'
        : signals[0] === 'crash'
          ? 'Crash-style failure'
          : signals[0] === 'network / transport'
            ? 'Network failure'
            : 'General log analysis',
  };
}

function renderPromptInsights(profile, hasInput) {
  if (!hasInput) {
    promptInsightBar.innerHTML = '<span class="prompt-pill prompt-pill-muted">Waiting for a log</span>';
    return;
  }

  const items = [
    `<span class="prompt-pill prompt-pill-strong">${escapeHtml(profile.title)}</span>`,
    `<span class="prompt-pill">Mode: ${escapeHtml(profile.mode)}</span>`,
    `<span class="prompt-pill">Context: ${profile.contextLines} lines</span>`,
    `<span class="prompt-pill">Blocks: ${profile.maxBlocks}</span>`,
    `<span class="prompt-pill prompt-pill-${profile.confidence}">Confidence: ${escapeHtml(profile.confidence)}</span>`,
  ];

  if (profile.signals.length) {
    items.push(`<span class="prompt-pill">Signals: ${escapeHtml(profile.signals.join(' · '))}</span>`);
  }
  if (profile.envHints.length) {
    items.push(`<span class="prompt-pill">Env: ${escapeHtml(profile.envHints.join(' · '))}</span>`);
  }

  promptInsightBar.innerHTML = items.join('');
}

function applyPromptProfile(profile) {
  promptModeSelect.value = profile.mode;
  contextLinesInput.value = String(profile.contextLines);
  maxBlocksInput.value = String(profile.maxBlocks);
  renderPromptInsights(profile, !!(promptInput.value || '').trim());
}

function refreshPromptInsights() {
  const input = promptInput.value || '';
  renderPromptInsights(detectPromptProfile(input), !!input.trim());
}

function findRelevantWindows(text, contextLines, maxBlocks) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const candidates = [];

  for (let i = 0; i < lines.length; i++) {
    const line = normalizeLogLine(lines[i]);
    if (!line.trim()) continue;
    if (isSignalLine(line)) {
      candidates.push({ index: i, score: severityScore(line), line });
    }
  }

  if (!candidates.length) {
    const firstNonEmpty = lines.findIndex((line) => normalizeLogLine(line).trim());
    if (firstNonEmpty === -1) {
      return { lines, windows: [], fallback: true };
    }
    const end = Math.min(lines.length, firstNonEmpty + Math.max(12, contextLines * 4 + 8));
    return {
      lines,
      windows: [{ start: firstNonEmpty, end, score: 1, fallback: true }],
      fallback: true,
    };
  }

  const windows = candidates.map(({ index, score }) => {
    let start = Math.max(0, index - contextLines);
    let end = Math.min(lines.length, index + contextLines + 1);

    while (start > 0 && !normalizeLogLine(lines[start - 1]).trim()) {
      start -= 1;
    }

    let cursor = end;
    while (cursor < lines.length && (isContinuationLine(normalizeLogLine(lines[cursor])) || !normalizeLogLine(lines[cursor]).trim())) {
      if (!normalizeLogLine(lines[cursor]).trim() && cursor - end > 3) break;
      cursor += 1;
      if (cursor - start > 120) break;
    }
    end = cursor;
    return { start, end, score };
  });

  windows.sort((a, b) => a.start - b.start || b.score - a.score);

  const merged = [];
  for (const win of windows) {
    const last = merged[merged.length - 1];
    if (!last || win.start > last.end) {
      merged.push({ ...win });
    } else {
      last.end = Math.max(last.end, win.end);
      last.score = Math.max(last.score, win.score);
    }
  }

  merged.sort((a, b) => b.score - a.score || a.start - b.start);
  return {
    lines,
    windows: merged.slice(0, maxBlocks).sort((a, b) => a.start - b.start),
    fallback: false,
  };
}

function summarizeRootCause(lines, windows) {
  const candidates = [];
  for (const win of windows) {
    for (let i = win.start; i < win.end; i++) {
      const line = normalizeLogLine(lines[i]).trim();
      if (!line) continue;
      if (/caused by|root cause|panic|fatal error|exception|traceback|error|failed|failure|timeout|permission denied|connection refused|module not found|not found|no such file/i.test(line)) {
        candidates.push({ line, index: i, score: severityScore(line) });
      }
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score || b.index - a.index);
  const picked = candidates[0];
  return {
    line: picked.line,
    lineNumber: picked.index + 1,
    candidates: candidates.slice(0, 3).map((item) => ({
      line: item.line,
      lineNumber: item.index + 1,
      score: item.score,
    })),
  };
}

function formatWindows(lines, windows) {
  const parts = [];
  for (const win of windows) {
    const header = `--- lines ${win.start + 1}-${win.end}`;
    parts.push(header);
    let lastText = null;
    let repeatCount = 0;
    for (let i = win.start; i < win.end; i++) {
      const raw = normalizeLogLine(lines[i]);
      const trimmed = raw.trimEnd();
      if (!trimmed) {
        if (lastText !== '') {
          parts.push('');
          lastText = '';
        }
        continue;
      }
      const numbered = `[L${String(i + 1).padStart(4, ' ')}] ${truncateLine(trimmed)}`;
      if (numbered === lastText) {
        repeatCount += 1;
        if (repeatCount === 1) {
          parts.push(numbered);
        }
        continue;
      }
      repeatCount = 0;
      parts.push(numbered);
      lastText = numbered;
    }
  }
  return parts.join('\n');
}

function choosePromptAsk(mode) {
  switch (mode) {
    case 'summary':
      return 'Summarize the incident clearly, keep it concise, and highlight the most important failure point.';
    case 'bug':
      return 'Rewrite this into a concise bug report with reproduction clues, impact, and the most likely root cause.';
    default:
      return 'Find the likely root cause, point to the line or component that matters, and suggest the next debugging steps.';
  }
}

function redactUsingCurrentRules(text) {
  const result = processTextWithActiveRedaction(text);
  return result.text;
}

function buildPromptDraft(input) {
  const contextLines = clampInt(contextLinesInput.value, 0, 12, 3);
  const maxBlocks = clampInt(maxBlocksInput.value, 1, 8, 4);
  const format = promptFormatSelect.value;
  const mode = promptModeSelect.value;
  const analysis = findRelevantWindows(input, contextLines, maxBlocks);
  const envHints = extractEnvironmentHints(input);
  const rootCause = summarizeRootCause(analysis.lines, analysis.windows);
  const relevantLogText = analysis.windows.length ? formatWindows(analysis.lines, analysis.windows) : '';

  const redactedLogText = redactUsingCurrentRules(relevantLogText || input.split('\n').slice(0, 40).join('\n'));
  const redactedRootCause = rootCause ? redactUsingCurrentRules(rootCause.line) : null;
  const redactedRootCandidates = rootCause?.candidates?.map((candidate) => ({
    line: candidate.lineNumber,
    text: redactUsingCurrentRules(candidate.line),
    score: candidate.score,
  })) || [];
  const redactedEnvHints = envHints.map((hint) => redactUsingCurrentRules(hint));
  const ask = choosePromptAsk(mode);

  const payload = {
    title: mode === 'bug' ? 'Bug report draft' : mode === 'summary' ? 'Incident summary draft' : 'Debug prompt',
    ask,
    signal_blocks: analysis.windows.length,
    root_cause_hint: redactedRootCause ? { line: rootCause.lineNumber, text: redactedRootCause } : null,
    root_cause_candidates: redactedRootCandidates,
    environment: redactedEnvHints,
    relevant_logs: redactedLogText,
  };

  if (format === 'json') {
    return {
      text: JSON.stringify(payload, null, 2),
      summary: {
        blocks: analysis.windows.length,
        root: redactedRootCause ? `L${rootCause.lineNumber}` : 'none detected',
        env: redactedEnvHints.length ? redactedEnvHints.join(' · ') : 'none detected',
        fallback: analysis.fallback,
      },
      analysis,
    };
  }

  const plain = format === 'plain';
  const lines = [];
  if (!plain) lines.push(`# ${payload.title}`);
  else lines.push(payload.title.toUpperCase());
  lines.push('');
  lines.push(plain ? `ASK: ${ask}` : '## Ask');
  if (!plain) lines.push(ask);
  lines.push('');
  lines.push(plain ? 'ENVIRONMENT:' : '## Environment');
  lines.push(redactedEnvHints.length ? redactedEnvHints.map((hint) => (plain ? `- ${hint}` : `- ${hint}`)).join('\n') : plain ? '- No obvious environment hints detected' : '- No obvious environment hints detected');
  lines.push('');
  lines.push(plain ? 'LIKELY ROOT CAUSE:' : '## Likely root cause');
  lines.push(redactedRootCause ? (plain ? `- Line ${rootCause.lineNumber}: ${redactedRootCause}` : `- Line ${rootCause.lineNumber}: ${redactedRootCause}`) : '- No obvious root cause found; inspect the excerpt below');
  if (redactedRootCandidates.length) {
    lines.push('');
    lines.push(plain ? 'ROOT-CAUSE CANDIDATES:' : '## Root-cause candidates');
    for (const candidate of redactedRootCandidates) {
      lines.push(`- Line ${candidate.line} [score ${candidate.score}]: ${candidate.text}`);
    }
  }
  lines.push('');
  lines.push(plain ? 'RELEVANT LOGS:' : '## Relevant logs');
  if (!plain) lines.push('```text');
  lines.push(redactedLogText || redactUsingCurrentRules(input.split('\n').slice(0, 40).join('\n')) || '(empty)');
  if (!plain) lines.push('```');
  lines.push('');
  lines.push(plain ? 'WHAT TO ANSWER:' : '## What to answer');
  lines.push('- Identify the failing component / line / call path');
  lines.push('- Explain the likely cause in one paragraph');
  lines.push('- Suggest the next 2-3 concrete debugging steps');

  return {
    text: lines.join('\n'),
    summary: {
      blocks: analysis.windows.length,
      root: redactedRootCause ? `L${rootCause.lineNumber}` : 'none detected',
      env: redactedEnvHints.length ? redactedEnvHints.join(' · ') : 'none detected',
      fallback: analysis.fallback,
    },
    analysis,
  };
}

function renderPromptOutput(result) {
  lastPromptText = result.text;
  lastPromptAnalysis = result.analysis;
  promptOutput.textContent = result.text;

  const summaryBits = [
    `<strong>${result.summary.blocks}</strong> error block${result.summary.blocks === 1 ? '' : 's'} kept`,
    result.summary.root !== 'none detected' ? `root cause hint at <strong>${result.summary.root}</strong>` : 'no clear root cause',
    result.summary.env !== 'none detected' ? `env: <strong>${escapeHtml(result.summary.env)}</strong>` : 'no obvious env hints',
  ];
  if (result.summary.fallback) summaryBits.push('used a trimmed sample because no standard error marker was found');
  promptSummary.innerHTML = summaryBits.join(' · ');
}

function buildAndRenderPrompt() {
  const input = promptInput.value || '';
  if (!input.trim()) {
    setPromptPlaceholder();
    return;
  }
  const result = buildPromptDraft(input);
  renderPromptOutput(result);
}

function applyAutoTuneAndBuild() {
  const input = promptInput.value || '';
  if (!input.trim()) {
    setPromptPlaceholder();
    return;
  }
  const profile = detectPromptProfile(input);
  applyPromptProfile(profile);
  buildAndRenderPrompt();
}

function loadSampleLog() {
  promptInput.value = SAMPLE_LOG;
  updateInputMeta();
  refreshPromptInsights();
  setTab('diff');
}

processBtn.addEventListener('click', () => processPrompt());
buildPromptBtn.addEventListener('click', () => buildAndRenderPrompt());
autoTuneBtn.addEventListener('click', () => applyAutoTuneAndBuild());
sampleBtn.addEventListener('click', () => {
  loadSampleLog();
  applyAutoTuneAndBuild();
});

clearBtn.addEventListener('click', () => {
  promptInput.value = '';
  findingsCount.textContent = '0';
  charsMetric.textContent = '0 → 0';
  tokensMetric.textContent = '0 → 0';
  statApiCount.textContent = '0';
  statPiiCount.textContent = '0';
  statDone.textContent = 'Done';
  findingsList.innerHTML = '';
  lastExportFindings = [];
  fileInput.value = '';
  pruneApiKeysToggle.checked = true;
  redactPiiToggle.checked = false;
  redactLogSecretsToggle.checked = true;
  genericSecretsToggle.checked = false;
  promptModeSelect.value = 'debug';
  contextLinesInput.value = '3';
  maxBlocksInput.value = '4';
  promptFormatSelect.value = 'markdown';
  updateInputMeta();
  setDiffPlaceholder();
  setAuditIdle();
  setPromptPlaceholder();
  setTab('diff');
});

copySanitizedBtn.addEventListener('click', async () => {
  if (!lastSanitized) return;
  try {
    await navigator.clipboard.writeText(lastSanitized);
    copySanitizedBtn.textContent = 'Copied';
    setTimeout(() => {
      copySanitizedBtn.textContent = 'Copy Sanitized';
    }, 1200);
  } catch (err) {
    console.error('Clipboard error:', err);
  }
});

exportJsonBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(lastExportFindings, null, 2));
    exportJsonBtn.textContent = 'Copied';
    setTimeout(() => {
      exportJsonBtn.textContent = 'Export JSON';
    }, 1200);
  } catch (err) {
    console.error('Clipboard error:', err);
  }
});

copyFindingsReportBtn.addEventListener('click', async () => {
  const lines = lastExportFindings.map((f) => `[${f.type}] ${f.label} L${f.lineNumber}: ${f.matched}`);
  const text = lines.join('\n');
  try {
    await navigator.clipboard.writeText(text || '(no findings)');
    copyFindingsReportBtn.textContent = 'Copied';
    setTimeout(() => {
      copyFindingsReportBtn.textContent = 'Copy Findings Report';
    }, 1200);
  } catch (err) {
    console.error('Clipboard error:', err);
  }
});

copyPromptBtn.addEventListener('click', async () => {
  const text = lastPromptText || promptOutput.textContent || '';
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    copyPromptBtn.textContent = 'Copied';
    setTimeout(() => {
      copyPromptBtn.textContent = 'Copy Prompt';
    }, 1200);
  } catch (err) {
    console.error('Clipboard error:', err);
  }
});

[[tabBtnDiff, 'diff'], [tabBtnOriginal, 'original'], [tabBtnSanitized, 'sanitized']].forEach(([btn, name]) => {
  btn.addEventListener('click', () => setTab(name));
});

pasteBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    promptInput.value = text;
    updateInputMeta();
    refreshPromptInsights();
  } catch (err) {
    console.error('Clipboard read error:', err);
  }
});

promptInput.addEventListener('input', () => {
  updateInputMeta();
  refreshPromptInsights();
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    promptInput.value = String(reader.result || '');
    updateInputMeta();
    refreshPromptInsights();
  };
  reader.readAsText(file);
});

async function initApp() {
  processBtn.disabled = true;
  processBtn.textContent = 'Loading rules...';
  setDiffPlaceholder();
  setPromptPlaceholder();
  try {
    await loadApiKeyPatterns();
    processBtn.disabled = false;
    processBtn.textContent = 'Sanitize Content';
    updateInputMeta();
    refreshPromptInsights();
  } catch (err) {
    console.error('Failed to initialize API key patterns:', err);
    processBtn.textContent = 'Rules load failed';
    findingsList.innerHTML = '<div class="muted">Failed to load API key rules. Check <code>web/api_key_rules.json</code>.</div>';
  }
}

setupDiffScrollSync();
initApp();
