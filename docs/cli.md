# CLI Reference

## Global Options

```bash
promptshield [COMMAND] [OPTIONS]
```

## Commands

### `scan` — Detect Leaks (No Redaction)

Scans text for API keys and PII without modifying it.

```bash
promptshield scan --input FILE [OPTIONS]
```

**Options:**
- `--input FILE`, `-i FILE` *(required)* — Input file to scan
- `--json` — Output as JSON (default: human-readable)

**Examples:**
```bash
# Scan a file
promptshield scan -i code.py

# Scan and save JSON report
promptshield scan -i code.py --json > report.json

# Pipe input
cat app.log | promptshield scan -i /dev/stdin
```

**Output:**
```
=== Scan Report ===

⚠ Found 2 potential issues:

API Keys:
  - OPENAI @ position 145
  - AWS @ position 340

PII:
  - email @ position 89
```

---

### `redact` — Redact Sensitive Data

Replaces detected sensitive data with placeholders.

```bash
promptshield redact --input FILE [OPTIONS]
```

**Options:**
- `--input FILE`, `-i FILE` *(required)* — Input file
- `--output FILE`, `-o FILE` — Output file (default: stdout)
- `--patterns PATTERN` `-p` *(multiple)* — Patterns to redact (default: api_keys, pii)
  - `api_keys` — API keys from all providers
  - `pii` — PII like SSN, email, phone
  - Custom: `custom_auth` (if defined in patterns.yaml)

**Examples:**
```bash
# Redact to stdout
promptshield redact -i prompt.txt

# Redact and save
promptshield redact -i prompt.txt -o clean.txt

# Only redact API keys (not PII)
promptshield redact -i code.py -p api_keys

# Multiple patterns
promptshield redact -i data.txt -p api_keys -p pii
```

---

### `compress` — Optimize Token Count

Reduces token count by removing unnecessary elements.

```bash
promptshield compress --input FILE [OPTIONS]
```

**Options:**
- `--input FILE`, `-i FILE` *(required)* — Input file
- `--output FILE`, `-o FILE` — Output file (default: stdout)

**Examples:**
```bash
# Compress and display
promptshield compress -i prompt.txt

# Compress and save
promptshield compress -i prompt.txt -o compressed.txt

# View compression stats
promptshield compress -i long_prompt.txt 2>&1 | grep "Tokens:"
```

**Output:**
```
[Stats] Tokens: 450 → 280 (37.8% saved)
```

---

### `process` — Full Pipeline

Combines scan → redact → compress in one command.

```bash
promptshield process --input FILE [OPTIONS]
```

**Options:**
- `--input FILE`, `-i FILE` *(required)* — Input file
- `--output FILE`, `-o FILE` — Output file (default: stdout)
- `--benchmark` — Show detailed before/after metrics

**Examples:**
```bash
# Full pipeline
promptshield process -i raw_prompt.txt -o final_prompt.txt

# With benchmarks
promptshield process -i data.txt --benchmark

# Save to file + view summary
promptshield process -i input.txt -o output.txt 2>&1
```

**Output:**
```
[Summary]
  Leaks found: 2
  Redactions: 3
  Tokens: 500 → 310 (38% saved)
```

---

## Configuration

Create `~/.promptshield/patterns.yaml`:

```yaml
patterns:
  api_keys:
    openai:
      - prefix: "sk-"
    custom_auth:
      - regex: "^token_[a-zA-Z0-9]{32}$"
  
  pii:
    ssn:
      enabled: true
    custom_id:
      - regex: "^ID[0-9]{8}$"
```

## Exit Codes

- `0` — Success
- `1` — Error (file not found, parse error, etc.)
- `2` — Invalid arguments

## Common Patterns

### Check if code has leaks (return non-zero if found)
```bash
if promptshield scan -i code.py --json | grep -q '"total_findings": 0'; then
  echo "✓ No leaks detected"
else
  echo "⚠ Leaks found!"
  exit 1
fi
```

### Pre-commit hook
```bash
#!/bin/bash
for file in $(git diff --cached --name-only); do
  promptshield scan -i "$file" --json | grep -q '"total_findings": 0' || {
    echo "⚠ Leaks in $file - commit blocked"
    exit 1
  }
done
```

### Process all logs in a directory
```bash
for log in logs/*.log; do
  promptshield process -i "$log" -o "clean/$log"
done
```
