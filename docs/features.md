# Features Overview

## Core Capabilities

### 1. **API Key Detection**
Detects credentials from major providers:

- **OpenAI**: `sk-`, `sk-proj-` patterns
- **AWS**: `AKIA`, `ASIA` prefixes
- **Google**: `AIza` keys
- **Stripe**: `sk_live_`, `rk_live_`, `pk_live_`
- **GitHub**: `ghp_`, `ghu_`, `ghs_`, `gho_` tokens
- **Anthropic**: `sk-ant-` keys
- **Hugging Face**: `hf_` tokens

### 2. **PII Redaction**
Redacts personally identifiable information:

- Social Security Numbers (SSN): `123-45-6789`
- Credit Cards: 13-16 digit numbers
- Email addresses
- Phone numbers (US & international)
- Cryptocurrency addresses (Bitcoin, Ethereum)
- IBAN numbers
- Dates of birth

### 3. **Token Compression**
Reduces prompt size by 20-40%:

- Strips markdown formatting (`**bold**`, `*italic*`, etc.)
- Removes code fence markers while preserving code
- Cleans excess whitespace and line breaks
- Removes common filler words
- Tracks token savings with `tiktoken`

### 4. **Privacy-First Design**
- **100% offline**: No cloud calls, no telemetry
- **Deterministic**: Same input = same output
- **Local-only**: Runs entirely on your machine

## Example Transformations

### API Key Redaction
**Before:**
```
Contact me via sk-proj-abc123def456ghi789 or email john@example.com
AWS_KEY=AKIAIOSFODNN7EXAMPLE
```

**After:**
```
Contact me via [API_KEY_OPENAI] or email [EMAIL]
AWS_KEY=[API_KEY_AWS]
```

### Compression
**Before:**
```
# Important Configuration

**This is very important**: Please configure the following:
- Item 1
- Item 2
```

**After:**
```
Important Configuration
Configure the following:
- Item 1
- Item 2
```

Tokens: 50 → 30 (40% saved)

## Configuration

Create `~/.promptshield/patterns.yaml` to customize detection:

```yaml
patterns:
  api_keys:
    custom_provider:
      - prefix: "auth_"
        min_length: 32
  
  pii:
    ssn:
      enabled: true
    custom_pii:
      - regex: "^ID[0-9]{8}$"
```

## Comparison with Other Tools

| Feature | PromptShield | CleanMyPrompt | Presidio | LLMLingua |
|---------|------------|--------------|----------|-----------|
| **Open Source** | ✅ | ❌ | ✅ | ✅ |
| **Local/Offline** | ✅ | ✅ | ✅ | ❌ |
| **CLI** | ✅ | ❌ | ❌ | ❌ |
| **Token Compression** | ✅ | ✅ | ❌ | ✅ |
| **Custom Patterns** | ✅ YAML | ❌ | ✅ regex | ❌ |
| **No Setup** | ✅ pip | ✅ browser | ❌ Docker | ❌ API |
| **API Key Detection** | 6+ providers | 6 providers | Limited | None |
| **PII Detection** | 7+ types | Some | Many | None |

## Use Cases

### 1. Developers
Paste server logs, API responses, and stack traces safely:
```bash
promptshield redact --input app.log --output clean.log
```

### 2. DevOps / SRE
Pre-process logs before sending to monitoring:
```bash
cat production.log | promptshield redact --patterns api_keys > safe.log
```

### 3. Prompt Engineers
Clean training data:
```bash
promptshield process --input training_data.txt --benchmark
```

### 4. Security Researchers
Audit code for accidental credential leaks:
```bash
promptshield scan --input repository/ --json | jq '.api_keys'
```

### 5. LLM Development Teams
Optimize prompts for cost reduction:
```python
from promptshield import PromptPipeline

pipeline = PromptPipeline()
result = pipeline.process(long_prompt)
print(f"Tokens saved: {result['compression']['saved_percentage']}%")
```
