# Quick Start

## 5-Minute Setup

### Installation
```bash
pip install promptshield
```

### Your First Scan
```bash
# Create a test file with sensitive data
cat > test.txt << 'EOF'
My email: john@example.com
API key: sk-proj-abc123def456
SSN: 123-45-6789
EOF

# Scan for leaks
promptshield scan -i test.txt
```

Output:
```
=== Scan Report ===

⚠ Found 3 potential issues:

API Keys:
  - OPENAI @ position 67

PII:
  - email @ position 9
  - ssn @ position 48
```

### Redact & Clean
```bash
# Remove sensitive data
promptshield redact -i test.txt -o clean.txt

# View result
cat clean.txt
```

Output:
```
My email: [EMAIL]
API key: [API_KEY_OPENAI]
SSN: [SSN]
```

### Compress Tokens
```bash
# Reduce token count
promptshield compress -i clean.txt

# See savings
# [Stats] Tokens: 28 → 24 (14% saved)
```

### Full Pipeline
```bash
# All at once: scan + redact + compress
promptshield process -i test.txt -o final.txt --benchmark

# View summary
cat final.txt
# [Summary]
#   Leaks found: 3
#   Redactions: 3
#   Tokens: 28 → 24 (14% saved)
```

---

## Python API

### Detect Leaks
```python
from promptshield import Scanner

scanner = Scanner()
result = scanner.scan("My API key is sk-proj-abc123")

if result['is_safe']:
    print("✓ Safe to use")
else:
    print(f"⚠ Found {result['total_findings']} issues!")
```

### Redact Data
```python
from promptshield import Redactor

redactor = Redactor()
clean, report = redactor.redact("Email: john@example.com, SSN: 123-45-6789")

print(clean)  # Email: [EMAIL], SSN: [SSN]
print(f"Redacted: {report['redactions_count']} items")
```

### Compress & Save Cost
```python
from promptshield import Compressor

compressor = Compressor()
compressed, stats = compressor.compress("Your long prompt here...")

print(f"Tokens: {stats['tokens_before']} → {stats['tokens_after']}")
print(f"Saved: {stats['saved_percentage']}%")
```

### Full Workflow
```python
from promptshield import PromptPipeline

pipeline = PromptPipeline()
result = pipeline.process(user_input_from_llm_api)

print("Clean text ready for LLM:")
print(result['final_text'])

print(f"\nStats: {result['compression']['saved_percentage']}% tokens saved")
```

---

## Real-World Scenarios

### Secure LLM Chat
```python
from promptshield import PromptPipeline
import openai

user_input = input("Ask me anything: ")

# Clean before sending
pipeline = PromptPipeline()
result = pipeline.process(user_input)

if result['scan']['total_findings'] > 0:
    print("⚠ Your message contains sensitive data!")
    print("I've removed it before sending to the AI.")

# Now safe to send
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": result['final_text']}]
)
```

### Pre-commit Safety
```bash
#!/bin/bash
# In .git/hooks/pre-commit

for file in $(git diff --cached --name-only); do
  promptshield scan -i "$file" --json | grep -q '"total_findings": 0' || {
    echo "⚠ Commit blocked: $file contains secrets!"
    exit 1
  }
done
```

### Cost Analysis
```python
from promptshield import Compressor

compressor = Compressor()
text = open('long_prompt.txt').read()

compressed, stats = compressor.compress(text)

# OpenAI GPT-4 input: $0.03 per 1K tokens
cost_per_1k = 0.03
savings = (stats['tokens_saved'] / 1000) * cost_per_1k

print(f"💰 Saved ${savings:.4f} per API call")
print(f"   @ 1000 calls/month: ${savings * 1000:.2f}")
```

---

## Next Steps

- **CLI Deep Dive**: See [CLI Reference](cli.md)
- **Python API**: See [API Docs](api.md)
- **Examples**: See [Examples](examples.md)
- **Customize**: See [Configuration](configuration.md)
- **Contribute**: See [Contributing](CONTRIBUTING.md)

---

**Questions?** Check [FAQ](faq.md) or open an [issue](https://github.com/newnol/promptshield/issues)
