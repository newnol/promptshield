# PromptShield Examples

Quick examples to get started.

## CLI Examples

### Scan for Leaks
```bash
# Scan a Python file
promptshield scan -i app.py

# Check if safe
if promptshield scan -i code.py --json | grep -q '"total_findings": 0'; then
  echo "✓ Safe to share"
else
  echo "⚠ Contains sensitive data"
fi
```

### Redact Sensitive Data
```bash
# Redact to stdout
promptshield redact -i raw_prompt.txt

# Save to file
promptshield redact -i raw_prompt.txt -o clean_prompt.txt

# Only redact API keys
promptshield redact -i code.py -p api_keys
```

### Compress Tokens
```bash
# Compress a long prompt
promptshield compress -i system_prompt.txt

# Save compressed version
promptshield compress -i long.txt -o short.txt
```

### Full Pipeline
```bash
# Scan + redact + compress all at once
promptshield process -i input.txt -o output.txt --benchmark

# View detailed report
promptshield process -i data.txt --benchmark 2>&1
```

---

## Python API Examples

### Basic Redaction
```python
from promptshield import Redactor

text = """
Please use API key: sk-proj-abc123def456
to connect to our service.
SSN: 123-45-6789
"""

redactor = Redactor()
clean, report = redactor.redact(text)

print(clean)
# Output:
# Please use API key: [API_KEY_OPENAI]
# to connect to our service.
# SSN: [SSN]

print(f"Redacted {report['redactions_count']} items")
```

### Check for Leaks
```python
from promptshield import Scanner

scanner = Scanner()

user_input = "Email: john@example.com, AWS key: AKIAIOSFODNN7EXAMPLE"
result = scanner.scan(user_input)

if result['is_safe']:
    print("✓ No leaks detected")
else:
    print(f"⚠ Found {result['total_findings']} issues!")
    for api in result['api_keys']:
        print(f"  API Key: {api['provider']}")
    for pii in result['pii']:
        print(f"  PII: {pii['category']}")
```

### Compress Prompts
```python
from promptshield import Compressor

compressor = Compressor()

long_prompt = """
# System Instructions

**Very Important**: Please follow these instructions carefully.

**Step 1**: Configure the system.
**Step 2**: Run the process.

---

Thank you!
"""

compressed, stats = compressor.compress(long_prompt)

print("Original:", stats['tokens_before'], "tokens")
print("Compressed:", stats['tokens_after'], "tokens")
print("Saved:", f"{stats['saved_percentage']}%")

print("\n--- Compressed Output ---")
print(compressed)
```

### Full Pipeline
```python
from promptshield import PromptPipeline

pipeline = PromptPipeline(benchmark=True)

raw_data = """
Contact: john@example.com
API Key: sk-proj-secret123

# Task Instructions

**Important**: Complete the following:
1. Item A
2. Item B

Thank you for using our service!
"""

result = pipeline.process(raw_data)

print("Final Text:")
print(result['final_text'])
print()
print("Summary:")
print(f"Leaks found: {result['scan']['total_findings']}")
print(f"Redacted: {result['redaction']['redactions_count']}")
print(f"Tokens: {result['benchmark']['original_tokens']} → {result['benchmark']['final_tokens']}")
print(f"Saved: {result['compression']['saved_percentage']}%")
```

### Production: Secure LLM Input
```python
from promptshield import PromptPipeline
import openai

# User provides a prompt (might contain secrets)
user_prompt = """
My API key is sk-proj-abc123xyz789

Please analyze this code:

```python
def connect():
    password = "MySecurePassword123"
    # ...
```

Also email me at john@company.com
"""

# Clean before sending
pipeline = PromptPipeline()
result = pipeline.process(user_prompt)

if result['scan']['total_findings'] > 0:
    print("⚠ Prompt contains sensitive data - review before proceeding")
    print(f"Found {result['scan']['total_findings']} issues")
    # Optionally send to alert channel
else:
    # Safe to send to LLM
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": result['final_text']}
        ]
    )
    print(response.choices[0].message.content)
```

### Pre-commit Hook
```python
#!/usr/bin/env python3
"""Pre-commit hook to prevent secret commits."""

import sys
from pathlib import Path
from promptshield import Scanner

scanner = Scanner()

# Get staged files (pseudo-code for git integration)
staged_files = [
    Path('app.py'),
    Path('config.yaml'),
    # ... etc
]

has_secrets = False

for file_path in staged_files:
    if not file_path.exists():
        continue
    
    with open(file_path) as f:
        result = scanner.scan(f.read())
    
    if not result['is_safe']:
        print(f"⚠ {file_path} contains {result['total_findings']} potential secrets:")
        for finding in result['api_keys'] + result['pii']:
            print(f"  - {finding.get('provider', finding.get('category'))}")
        has_secrets = True

if has_secrets:
    print("\n💡 Tip: Use 'promptshield redact -i FILE' to clean")
    sys.exit(1)

sys.exit(0)
```

### Batch Processing
```python
import json
from pathlib import Path
from promptshield import PromptPipeline

pipeline = PromptPipeline()
input_file = Path("raw_prompts.jsonl")
output_file = Path("clean_prompts.jsonl")

with open(input_file) as infile, open(output_file, 'w') as outfile:
    for line in infile:
        item = json.loads(line)
        
        result = pipeline.process(item['content'])
        
        item['clean_content'] = result['final_text']
        item['had_secrets'] = not result['scan']['is_safe']
        item['tokens_saved'] = result['compression']['tokens_saved']
        
        outfile.write(json.dumps(item) + "\n")

print(f"✓ Processed {input_file} → {output_file}")
```

### Cost Analysis
```python
from promptshield import Compressor

# OpenAI pricing (Jan 2026)
GPT4_INPUT_PRICE = 0.03 / 1000  # $0.03 per 1K tokens
GPT4_OUTPUT_PRICE = 0.06 / 1000

def analyze_cost(prompts: list[str]):
    compressor = Compressor()
    total_saved = 0
    
    for prompt in prompts:
        compressed, stats = compressor.compress(prompt)
        saved_tokens = stats['tokens_saved']
        cost_saved = saved_tokens * GPT4_INPUT_PRICE
        total_saved += cost_saved
        
        print(f"Prompt: {saved_tokens} tokens → ${cost_saved:.4f}")
    
    print(f"\nTotal potential savings: ${total_saved:.2f} per run")
    return total_saved

# Example
prompts = [
    "**Important Task**: Please do X. Thank you!",
    "# Configuration\n\n**Critical**: Setup Y",
    # ... more prompts
]

analyze_cost(prompts)
```

---

## Integration Examples

### GitHub Action
```yaml
# .github/workflows/secret-check.yml
name: Check for Secrets

on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install PromptShield
        run: pip install promptshield
      
      - name: Scan changed files
        run: |
          for file in $(git diff --name-only origin/main); do
            echo "Checking $file..."
            promptshield scan -i "$file" --json | grep -q '"total_findings": 0' || {
              echo "⚠ Secrets found in $file"
              exit 1
            }
          done
```

### Pre-commit Config
```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: promptshield-scan
        name: Scan for secrets with PromptShield
        entry: promptshield scan -i
        language: system
        stages: [commit]
        types: [python, yaml, json, text]
```

---

## Tips & Tricks

### 1. Combine with git
```bash
# Find all files with potential secrets
git grep -l "sk-" || promptshield scan -i .
```

### 2. Create a safe copy
```bash
# Process all .txt files
for f in *.txt; do
  promptshield process -i "$f" -o "safe_$f"
done
```

### 3. Monitor compression
```bash
# Track token savings
for file in prompts/*.txt; do
  promptshield compress -i "$file" 2>&1 | grep "Tokens:"
done | awk -F' ' '{sum += $NF} END {print "Total: " sum "%"}'
```

### 4. Audit pattern matching
```bash
# Check what gets detected
promptshield scan -i file.py --json | jq '.api_keys[] | .provider' | sort | uniq -c
```

---

Need more examples? Check [examples/](../examples/) or [GitHub Discussions](https://github.com/newnol/promptshield/discussions)!
