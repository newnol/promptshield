let apiKeyPatterns = {};

const piiPatterns = {
  ssn: [/\b\d{3}-\d{2}-\d{4}\b/g],
  credit_card: [/\b\d{13,16}\b/g],
  email: [/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g],
  phone: [/\b\+?1?\s?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, /\b\+[0-9]{1,3}\s?[0-9\s\-()]{7,14}\b/g],
  bitcoin_address: [/\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g, /\bbc1[a-z0-9]{39,59}\b/g],
  ethereum_address: [/\b0x[a-fA-F0-9]{40}\b/g],
  iban: [/\b[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}\b/g]
};

const promptInput = document.getElementById("promptInput");
const outputText = document.getElementById("outputText");
const processBtn = document.getElementById("processBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const fileInput = document.getElementById("fileInput");
const findingsCount = document.getElementById("findingsCount");
const charsMetric = document.getElementById("charsMetric");
const tokensMetric = document.getElementById("tokensMetric");
const findingsList = document.getElementById("findingsList");

const pruneApiKeysToggle = document.getElementById("pruneApiKeysToggle");
const redactPiiToggle = document.getElementById("redactPiiToggle");
const genericSecretsToggle = document.getElementById("genericSecretsToggle");
const pasteBtn = document.getElementById("pasteBtn");
const inputLineCount = document.getElementById("inputLineCount");
const inputCharCount = document.getElementById("inputCharCount");
const auditPanel = document.getElementById("auditPanel");

const AUDIT_IDLE_HTML = `
  <div class="audit-placeholder">
    <div class="audit-icon" aria-hidden="true">&#128274;</div>
    <p class="audit-title">Awaiting input</p>
    <p class="audit-desc">Run <strong>Sanitize Content</strong> to scan locally. Your data never leaves this browser window.</p>
  </div>
`;

function getApiKeyPatternsForRun() {
  const p = { ...apiKeyPatterns };
  if (!genericSecretsToggle.checked) {
    delete p.generic;
  }
  return p;
}

function updateInputMeta() {
  const text = promptInput.value || "";
  const lines = text ? text.split(/\n/).length : 0;
  inputLineCount.textContent = String(lines);
  inputCharCount.textContent = String(text.length);
}

function setAuditIdle() {
  auditPanel.innerHTML = AUDIT_IDLE_HTML;
}

function setAuditAfterRun(total, apiCount, piiCount) {
  auditPanel.innerHTML = `
    <div class="audit-summary">
      <p style="margin:0 0 0.5rem;"><strong>${total}</strong> finding${total === 1 ? "" : "s"}</p>
      <p style="margin:0;font-size:0.78rem;line-height:1.45;">
        API key patterns: <strong>${apiCount}</strong><br>
        PII: <strong>${piiCount}</strong>
      </p>
    </div>
  `;
}

function buildLineStarts(text) {
  // lineStarts[i] = index in `text` where line (i+1) starts (0-based).
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") lineStarts.push(i + 1);
  }
  return lineStarts;
}

function indexToLineCol(lineStarts, index) {
  // Binary search for last lineStart <= index.
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
  const lineNumber = lineIdx + 1; // 1-based for users
  const colNumber = index - lineStarts[lineIdx] + 1; // 1-based
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
        // Keep generic labeled-secret pattern case-insensitive.
        const flags = provider === "generic" ? "gi" : "g";
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
  const response = await fetch("./api_key_rules.json", { cache: "no-store" });
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
          matched: match[0]
        });
      }
    }
  }

  return results.sort((a, b) => a.start - b.start);
}

function redactText(text, findings) {
  if (!findings.length) {
    return text;
  }

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
  let out = "";
  for (const hit of merged) {
    out += text.slice(cursor, hit.start);
    const tag = hit.type === "api_key" ? `API_KEY_${hit.label.toUpperCase()}` : hit.label.toUpperCase();
    out += `[${tag}]`;
    cursor = hit.end;
  }
  out += text.slice(cursor);
  return out;
}

function estimateTokens(text) {
  // Fast approximation for UI feedback in browser-only mode.
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  return Math.max(0, Math.round(words * 1.3 + chars / 20));
}

function renderFindings(apiFindings, piiFindings) {
  const all = [...apiFindings, ...piiFindings];
  findingsList.innerHTML = "";
  if (!all.length) {
    findingsList.innerHTML = '<div class="muted">No sensitive patterns detected.</div>';
    return;
  }

  for (const item of all.slice(0, 50)) {
    const snippet = item.matched.length > 22 ? `${item.matched.slice(0, 22)}...` : item.matched;
    const row = document.createElement("div");
    row.className = "finding-item";
    const kind = item.type === "api_key" ? "API key" : "PII";
    const lineNumber = item.lineNumber ?? "?";
    const colNumber = item.colNumber ?? "?";
    row.textContent = `${kind} | ${item.label} | line ${lineNumber}:${colNumber} | "${snippet}"`;
    findingsList.appendChild(row);
  }
}

function makeDetectAndRedactStep({ enabledEl, patterns, type }) {
  // A pipeline step is: detect -> redact -> return {text, findings}
  return {
    enabled: () => !!enabledEl.checked,
    run: (text) => {
      const lineStarts = buildLineStarts(text);
      const findings = detectMatches(text, patterns, type);
      // Attach line/col information based on the text used for detection in this step.
      const enrichedFindings = findings.map((f) => {
        const { lineNumber, colNumber } = indexToLineCol(lineStarts, f.start);
        return { ...f, lineNumber, colNumber };
      });
      const redacted = redactText(text, findings);
      return { text: redacted, findings: enrichedFindings };
    }
  };
}

function processPrompt() {
  const input = promptInput.value || "";
  const redactedFindings = [];

  // Pipeline design: add more steps later (e.g., optimize) by registering steps here.
  const steps = [
    makeDetectAndRedactStep({
      enabledEl: pruneApiKeysToggle,
      patterns: getApiKeyPatternsForRun(),
      type: "api_key",
    }),
    makeDetectAndRedactStep({
      enabledEl: redactPiiToggle,
      patterns: piiPatterns,
      type: "pii",
    }),
  ];

  let result = input;
  for (const step of steps) {
    if (!step.enabled()) continue;
    const stepResult = step.run(result);
    result = stepResult.text;
    redactedFindings.push(...stepResult.findings);
  }

  const apiFindings = redactedFindings.filter((f) => f.type === "api_key");
  const piiFindings = redactedFindings.filter((f) => f.type === "pii");
  const allFindings = redactedFindings.sort((a, b) => a.start - b.start);

  outputText.value = result;
  findingsCount.textContent = String(allFindings.length);
  charsMetric.textContent = `${input.length} → ${result.length}`;
  tokensMetric.textContent = `${estimateTokens(input)} → ${estimateTokens(result)}`;
  renderFindings(apiFindings, piiFindings);
  setAuditAfterRun(allFindings.length, apiFindings.length, piiFindings.length);
}

processBtn.addEventListener("click", processPrompt);

clearBtn.addEventListener("click", () => {
  promptInput.value = "";
  outputText.value = "";
  findingsCount.textContent = "0";
  charsMetric.textContent = "0 → 0";
  tokensMetric.textContent = "0 → 0";
  findingsList.innerHTML = "";
  fileInput.value = "";
  pruneApiKeysToggle.checked = true;
  redactPiiToggle.checked = false;
  genericSecretsToggle.checked = false;
  updateInputMeta();
  setAuditIdle();
});

copyBtn.addEventListener("click", async () => {
  const value = outputText.value;
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    copyBtn.textContent = "Copied";
    setTimeout(() => {
      copyBtn.textContent = "Copy output";
    }, 1200);
  } catch (err) {
    console.error("Clipboard error:", err);
  }
});

pasteBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    promptInput.value = text;
    updateInputMeta();
  } catch (err) {
    console.error("Clipboard read error:", err);
  }
});

promptInput.addEventListener("input", updateInputMeta);

fileInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    promptInput.value = String(reader.result || "");
    updateInputMeta();
  };
  reader.readAsText(file);
});

async function initApp() {
  processBtn.disabled = true;
  processBtn.textContent = "Loading rules...";
  try {
    await loadApiKeyPatterns();
    processBtn.disabled = false;
    processBtn.textContent = "Sanitize Content";
    updateInputMeta();
  } catch (err) {
    console.error("Failed to initialize API key patterns:", err);
    processBtn.textContent = "Rules load failed";
    findingsList.innerHTML = '<div class="muted">Failed to load API key rules. Check <code>web/api_key_rules.json</code>.</div>';
  }
}

initApp();
