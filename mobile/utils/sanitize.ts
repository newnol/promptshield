import rulesJson from "../assets/api_key_rules.json";

export type FindingType = "api_key" | "pii";

export interface Finding {
  type: FindingType;
  label: string;
  start: number;
  end: number;
  matched: string;
  lineNumber: number;
  colNumber: number;
}

export interface SanitizeOptions {
  pruneApiKeys: boolean;
  redactPii: boolean;
  /** When false, omits `generic` provider patterns from API key detection */
  genericSecrets: boolean;
  /** Provider keys to skip (e.g. `aws`, `openai`) */
  disabledApiProviders?: string[];
  /** PII category keys to skip */
  disabledPiiCategories?: string[];
}

export interface SanitizeResult {
  sanitized: string;
  findings: Finding[];
  apiKeyCount: number;
  piiCount: number;
}

const piiPatterns: Record<string, RegExp[]> = {
  ssn: [/\b\d{3}-\d{2}-\d{4}\b/g],
  credit_card: [/\b\d{13,16}\b/g],
  email: [/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g],
  phone: [
    /\b\+?1?\s?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    /\b\+[0-9]{1,3}\s?[0-9\s\-()]{7,14}\b/g,
  ],
  bitcoin_address: [/\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g, /\bbc1[a-z0-9]{39,59}\b/g],
  ethereum_address: [/\b0x[a-fA-F0-9]{40}\b/g],
  iban: [/\b[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}\b/g],
};

function cloneRegex(r: RegExp) {
  return new RegExp(r.source, r.flags);
}

function buildLineStarts(text: string): number[] {
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") lineStarts.push(i + 1);
  }
  return lineStarts;
}

function indexToLineCol(lineStarts: number[], index: number) {
  let low = 0;
  let high = lineStarts.length - 1;
  let lineIdx = 0;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lineStarts[mid]! <= index) {
      lineIdx = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return {
    lineNumber: lineIdx + 1,
    colNumber: index - lineStarts[lineIdx]! + 1,
  };
}

export function compileApiKeyPatterns(
  rules: Record<string, { regex: string; label?: string }[]>,
  options: Pick<SanitizeOptions, "genericSecrets" | "disabledApiProviders">
): Record<string, RegExp[]> {
  const disabled = new Set(options.disabledApiProviders ?? []);
  const compiled: Record<string, RegExp[]> = {};
  for (const [provider, providerRules] of Object.entries(rules || {})) {
    if (provider === "generic" && !options.genericSecrets) continue;
    if (disabled.has(provider)) continue;
    const patterns: RegExp[] = [];
    for (const rule of providerRules || []) {
      if (!rule?.regex) continue;
      try {
        const flags = provider === "generic" ? "gi" : "g";
        patterns.push(new RegExp(rule.regex, flags));
      } catch {
        /* skip invalid */
      }
    }
    if (patterns.length) compiled[provider] = patterns;
  }
  return compiled;
}

function detectMatches(
  text: string,
  groupedPatterns: Record<string, RegExp[]>,
  type: FindingType
): Omit<Finding, "lineNumber" | "colNumber">[] {
  const results: Omit<Finding, "lineNumber" | "colNumber">[] = [];
  for (const [label, patterns] of Object.entries(groupedPatterns)) {
    for (const pattern of patterns) {
      const reg = cloneRegex(pattern);
      let match: RegExpExecArray | null;
      while ((match = reg.exec(text)) !== null) {
        results.push({
          type,
          label,
          start: match.index,
          end: match.index + match[0].length,
          matched: match[0],
        });
      }
    }
  }
  return results.sort((a, b) => a.start - b.start);
}

function redactText(
  text: string,
  findings: Omit<Finding, "lineNumber" | "colNumber">[]
): string {
  if (!findings.length) return text;
  const merged: typeof findings = [];
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
    const tag =
      hit.type === "api_key"
        ? `API_KEY_${hit.label.toUpperCase()}`
        : hit.label.toUpperCase();
    out += `[${tag}]`;
    cursor = hit.end;
  }
  out += text.slice(cursor);
  return out;
}

function enrichFindings(
  text: string,
  findings: Omit<Finding, "lineNumber" | "colNumber">[]
): Finding[] {
  const lineStarts = buildLineStarts(text);
  return findings.map((f) => {
    const { lineNumber, colNumber } = indexToLineCol(lineStarts, f.start);
    return { ...f, lineNumber, colNumber };
  });
}

function filterPiiPatterns(disabled?: string[]): Record<string, RegExp[]> {
  if (!disabled?.length) return piiPatterns;
  const out = { ...piiPatterns };
  for (const k of disabled) delete out[k];
  return out;
}

export function sanitizeContent(
  input: string,
  options: SanitizeOptions
): SanitizeResult {
  const rules = rulesJson as Record<string, { regex: string; label?: string }[]>;
  const apiPatterns = options.pruneApiKeys
    ? compileApiKeyPatterns(rules, {
        genericSecrets: options.genericSecrets,
        disabledApiProviders: options.disabledApiProviders,
      })
    : {};

  const piiFiltered = options.redactPii
    ? filterPiiPatterns(options.disabledPiiCategories)
    : {};

  const steps: {
    run: (t: string) => { text: string; findings: Finding[] };
  }[] = [];

  if (options.pruneApiKeys && Object.keys(apiPatterns).length) {
    steps.push({
      run: (text) => {
        const raw = detectMatches(text, apiPatterns, "api_key");
        const redacted = redactText(text, raw);
        const findings = enrichFindings(text, raw);
        return { text: redacted, findings };
      },
    });
  }

  if (options.redactPii && Object.keys(piiFiltered).length) {
    steps.push({
      run: (text) => {
        const raw = detectMatches(text, piiFiltered, "pii");
        const redacted = redactText(text, raw);
        const findings = enrichFindings(text, raw);
        return { text: redacted, findings };
      },
    });
  }

  let result = input;
  const all: Finding[] = [];
  for (const step of steps) {
    const { text, findings } = step.run(result);
    result = text;
    all.push(...findings);
  }

  const apiKeyCount = all.filter((f) => f.type === "api_key").length;
  const piiCount = all.filter((f) => f.type === "pii").length;

  return {
    sanitized: result,
    findings: all.sort((a, b) => a.start - b.start),
    apiKeyCount,
    piiCount,
  };
}

export function countLinesAndChars(text: string) {
  const lines = text.length === 0 ? 0 : text.split("\n").length;
  return { lines, chars: text.length };
}
