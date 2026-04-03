const apiKeyPatterns = {
  openai: [/sk-proj-[a-zA-Z0-9\-_]{32,}/g, /sk-[a-zA-Z0-9]{48,}/g],
  aws: [/AKIA[0-9A-Z]{16}/g, /ASIA[0-9A-Z]{16}/g],
  google: [/AIza[0-9A-Za-z\-_]{35}/g],
  stripe: [/sk_live_[a-zA-Z0-9]{24,}/g, /rk_live_[a-zA-Z0-9]{24,}/g, /pk_live_[a-zA-Z0-9]{24,}/g],
  github: [/ghp_[a-zA-Z0-9]{36,255}/g, /ghu_[a-zA-Z0-9]{36,255}/g, /ghs_[a-zA-Z0-9]{36,255}/g, /gho_[a-zA-Z0-9]{36,255}/g],
  anthropic: [/sk-ant-[a-zA-Z0-9\-_]{32,}/g],
  huggingface: [/hf_[a-zA-Z0-9]{34,}/g],
  telegram_bot: [/\b\d{9,11}:[a-zA-Z0-9_-]{35,}\b/g],
  generic: [
    /\b[A-Za-z0-9]{32,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
    /\b(key|token|secret|api[_-]?key)[\s:=]+['"]?[A-Za-z0-9_-]{24,}['"]?/gi
  ]
};

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

function cloneRegex(regex) {
  return new RegExp(regex.source, regex.flags);
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

function summarizeFindings(apiFindings, piiFindings) {
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
    row.textContent = `${item.type === "api_key" ? "API key" : "PII"} | ${item.label} | "${snippet}"`;
    findingsList.appendChild(row);
  }
}

function pruneApiKeysStep(text) {
  const findings = detectMatches(text, apiKeyPatterns, "api_key");
  const redacted = redactText(text, findings);
  return {
    text: redacted,
    findings,
  };
}

function redactPiiStep(text) {
  const findings = detectMatches(text, piiPatterns, "pii");
  const redacted = redactText(text, findings);
  return {
    text: redacted,
    findings,
  };
}

function processPrompt() {
  const input = promptInput.value || "";
  const redactedFindings = [];

  // Pipeline design: add more steps later (e.g., "optimize") without changing UI wiring.
  const steps = [
    {
      enabled: () => !!pruneApiKeysToggle.checked,
      run: pruneApiKeysStep,
    },
    {
      enabled: () => !!redactPiiToggle.checked,
      run: redactPiiStep,
    }
    // Future step placeholder:
    // { enabled: () => ..., run: optimizeStep }
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
  charsMetric.textContent = `${input.length} -> ${result.length}`;
  tokensMetric.textContent = `${estimateTokens(input)} -> ${estimateTokens(result)}`;
  summarizeFindings(apiFindings, piiFindings);
}

processBtn.addEventListener("click", processPrompt);

clearBtn.addEventListener("click", () => {
  promptInput.value = "";
  outputText.value = "";
  findingsCount.textContent = "0";
  charsMetric.textContent = "0 -> 0";
  tokensMetric.textContent = "0 -> 0";
  findingsList.innerHTML = "";
  fileInput.value = "";
  pruneApiKeysToggle.checked = true;
  redactPiiToggle.checked = false;
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

fileInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    promptInput.value = String(reader.result || "");
  };
  reader.readAsText(file);
});
