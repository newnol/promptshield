# Python API Reference

## Core Classes

### `Redactor`

Redacts sensitive data from text.

```python
from promptshield import Redactor

redactor = Redactor(patterns=['api_keys', 'pii'])
redacted_text, report = redactor.redact(text)
```

**Parameters:**
- `patterns` (List[str]) — Which patterns to detect
  - Default: `['api_keys', 'pii']`
  - Options: `api_keys`, `pii`, or custom from patterns.yaml

**Returns:**
- `(redacted_text: str, report: dict)` — Redacted text and metadata

**Report Structure:**
```python
{
    'redactions_count': 5,
    'items': [
        {
            'type': 'API_KEY',
            'provider': 'openai',
            'original_length': 48
        },
        ...
    ],
    'original_text_length': 2500,
    'redacted_text_length': 2400
}
```

**Example:**
```python
text = """
API Key: sk-proj-abc123def456
SSN: 123-45-6789
"""

redactor = Redactor(patterns=['api_keys', 'pii'])
clean, report = redactor.redact(text)

print(clean)
# API Key: [API_KEY_OPENAI]
# SSN: [SSN]

print(f"Redacted {report['redactions_count']} items")
```

---

### `Compressor`

Reduces token count by optimizing text.

```python
from promptshield import Compressor

compressor = Compressor()
compressed_text, stats = compressor.compress(text)
```

**Parameters:**
- `encoding` (str) — Tiktoken encoding (default: `"cl100k_base"` for GPT-3.5/4)
  - Options: `"cl100k_base"`, `"p50k_base"`, `"r50k_base"`

**Methods:**
- `compress(text: str) -> (str, dict)` — Compress and return stats
- `count_tokens(text: str) -> int` — Count tokens without compressing

**Returns:**
```python
{
    'tokens_before': 500,
    'tokens_after': 310,
    'tokens_saved': 190,
    'saved_percentage': 38.0
}
```

**Example:**
```python
text = """
# Important Configuration

**This is very important**: Please configure the following:
- Item 1
- Item 2
"""

compressor = Compressor()
compressed, stats = compressor.compress(text)

print(f"Saved {stats['saved_percentage']}% tokens")
print(compressed)
```

---

### `Scanner`

Detects sensitive data without modifying text.

```python
from promptshield import Scanner

scanner = Scanner()
result = scanner.scan(text)
```

**Returns:**
```python
{
    'api_keys': [
        {
            'provider': 'openai',
            'snippet': 'sk-proj-***',
            'position': 145
        },
        ...
    ],
    'pii': [
        {
            'category': 'email',
            'snippet': '***',
            'position': 89
        },
        ...
    ],
    'total_findings': 5,
    'is_safe': False
}
```

**Example:**
```python
text = "My email is john@example.com and API key is sk-proj-abc123"

scanner = Scanner()
result = scanner.scan(text)

if not result['is_safe']:
    print(f"⚠ Found {result['total_findings']} issues!")
    for ak in result['api_keys']:
        print(f"  - {ak['provider']} at position {ak['position']}")
```

---

### `PromptPipeline`

Combined workflow: scan → redact → compress.

```python
from promptshield import PromptPipeline

pipeline = PromptPipeline(
    steps=['scan', 'redact', 'compress'],
    benchmark=True
)
result = pipeline.process(text)
```

**Parameters:**
- `steps` (List[str]) — Which steps to run (default: all)
- `benchmark` (bool) — Track before/after metrics (default: True)

**Returns:**
```python
{
    'original_text': str,
    'final_text': str,
    'scan': {...},           # Scanner output
    'redaction': {...},      # Redactor output
    'compression': {...},    # Compressor output
    'benchmark': {
        'original_length': 2500,
        'final_length': 1800,
        'original_tokens': 500,
        'final_tokens': 310
    }
}
```

**Example:**
```python
raw_prompt = """
API Key: sk-proj-abc123
Email: john@example.com

# Important Task

**Please do the following:**
- Step 1
- Step 2
"""

pipeline = PromptPipeline()
result = pipeline.process(raw_prompt)

print(result['final_text'])
print(f"Tokens: {result['benchmark']['original_tokens']} → {result['benchmark']['final_tokens']}")
```

---

## Usage Patterns

### 1. Secure Prompt Submission
```python
from promptshield import PromptPipeline

user_prompt = input("Enter your prompt: ")

# Process before sending to LLM
pipeline = PromptPipeline()
result = pipeline.process(user_prompt)

if result['scan']['is_safe']:
    # Send to API
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": result['final_text']}]
    )
else:
    print("⚠ Prompt contains sensitive data!")
```

### 2. Pre-commit Validation
```python
from promptshield import Scanner
import subprocess

scanner = Scanner()

# Get changed files
files = subprocess.check_output(['git', 'diff', '--cached', '--name-only']).decode().split('\n')

for file in files:
    with open(file) as f:
        result = scanner.scan(f.read())
        if not result['is_safe']:
            print(f"⚠ {file} contains sensitive data!")
            exit(1)
```

### 3. Cost Optimization
```python
from promptshield import Compressor

long_prompt = load_prompt_from_file()

compressor = Compressor()
compressed, stats = compressor.compress(long_prompt)

# Calculate cost savings
token_price_per_1k = 0.03  # OpenAI GPT-4 input
saved_cost = (stats['tokens_saved'] / 1000) * token_price_per_1k

print(f"✓ Saved {stats['tokens_saved']} tokens (${saved_cost:.4f})")
```

### 4. Batch Processing
```python
from promptshield import PromptPipeline
import json

pipeline = PromptPipeline()

with open('raw_data.jsonl') as f:
    for line in f:
        item = json.loads(line)
        result = pipeline.process(item['content'])
        item['clean_content'] = result['final_text']
        print(json.dumps(item))
```

---

## Configuration

Load custom patterns from `~/.promptshield/patterns.yaml`:

```python
from promptshield import Redactor
import yaml

with open('~/.promptshield/patterns.yaml') as f:
    config = yaml.safe_load(f)

# Patterns are auto-loaded when creating Redactor
redactor = Redactor()
```

To override patterns programmatically:

```python
# Currently: manual pattern definition in detector/*.py
# Future: YAML loading support (Phase 2)
```

---

## Error Handling

All classes raise `PromptShieldError` on issues:

```python
from promptshield import Redactor
from promptshield.errors import PromptShieldError

try:
    redactor = Redactor()
    clean, report = redactor.redact(text)
except PromptShieldError as e:
    print(f"Error: {e}")
```

---

## Performance

- **Detection**: ~1ms per 1KB of text
- **Redaction**: ~2ms per 1KB
- **Compression**: ~5-10ms per 1KB (depends on tiktoken encoding)
- **Pipeline**: ~10-20ms total for typical prompts

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on extending the API.
