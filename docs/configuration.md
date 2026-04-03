# Configuration Guide

## Default Patterns

PromptShield detects these patterns out of the box:

### API Keys
- **OpenAI**: `sk-`, `sk-proj-` (40+ chars)
- **AWS**: `AKIA`, `ASIA` (16 chars)
- **Google**: `AIza` (35 chars)
- **Stripe**: `sk_live_`, `rk_live_` (24+ chars)
- **GitHub**: `ghp_`, `ghu_`, `ghs_`, `gho_` (36-255 chars)
- **Anthropic**: `sk-ant-` (32+ chars)
- **Hugging Face**: `hf_` (34+ chars)

### PII
- Social Security Numbers: `123-45-6789`
- Credit Cards: 13-16 digit numbers
- Emails: `name@domain.com`
- Phones: US & international formats
- Crypto: Bitcoin, Ethereum addresses
- IBAN: International bank account numbers
- Dates: Various date formats

## Custom Configuration

Create `~/.promptshield/patterns.yaml` to customize detection:

```yaml
patterns:
  api_keys:
    # Built-in providers (auto-detected)
    openai:
      - prefix: "sk-"
        min_length: 40
    
    # Custom provider
    my_service:
      - prefix: "mytoken_"
        min_length: 32
      - regex: "^auth_[a-zA-Z0-9]{32}$"
  
  pii:
    # Built-in categories
    email:
      enabled: true
    
    # Custom PII patterns
    employee_id:
      - regex: "^EMP[0-9]{6}$"
    
    # Disable built-in detection
    phone:
      enabled: false
```

## Advanced Configuration

### Pattern Matching Strategy

**Prefix-based (default, fast):**
```yaml
api_keys:
  my_service:
    - prefix: "token_"
      min_length: 20  # Optional: minimum total length
```

**Regex-based (powerful, slower):**
```yaml
api_keys:
  custom:
    - regex: "^auth_[a-zA-Z0-9]{32}$"
```

### PII Categories

Enable/disable individual categories:

```yaml
pii:
  ssn:
    enabled: true
  credit_card:
    enabled: false  # Don't detect credit cards
  custom_field:
    - regex: "^[0-9]{4}X[0-9]{4}$"
```

### Redaction Placeholders

Change placeholder format:

```yaml
redaction:
  placeholder_prefix: "["
  placeholder_suffix: "]"
  # [API_KEY_OPENAI] vs {API_KEY_OPENAI} vs ***
```

## Environment Variables

```bash
# Custom config path
export PROMPTSHIELD_CONFIG=/path/to/patterns.yaml

# Encoding (for token counting)
export PROMPTSHIELD_ENCODING=cl100k_base

# Log level
export PROMPTSHIELD_LOG_LEVEL=debug
```

## Example Configurations

### Strict Security (Redact Everything)

```yaml
patterns:
  api_keys:
    # All major providers
    openai: [{ prefix: "sk-" }]
    aws: [{ prefix: "AKIA" }, { prefix: "ASIA" }]
    google: [{ prefix: "AIza" }]
    stripe: [{ prefix: "sk_live_" }]
    github: [{ prefix: "ghp_" }]
  
  pii:
    ssn: { enabled: true }
    email: { enabled: true }
    phone: { enabled: true }
    credit_card: { enabled: true }
    date_of_birth: { enabled: true }
```

### Permissive (Only Detect Secrets)

```yaml
patterns:
  api_keys:
    openai: [{ prefix: "sk-" }]
    aws: [{ prefix: "AKIA" }]
    github: [{ prefix: "ghp_" }]
  
  pii: {}  # No PII detection
```

### Enterprise (Custom Credentials)

```yaml
patterns:
  api_keys:
    # Standard providers
    openai: [{ prefix: "sk-" }]
    
    # Enterprise internal
    auth_service:
      - regex: "^SERVICE_[A-Z0-9]{32}$"
    
    internal_token:
      - regex: "^INT-[0-9]{10}$"
    
    database_password:
      - regex: "^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]{16,}$"
  
  pii:
    employee_id:
      - regex: "^EMP[0-9]{6}$"
    
    ssn: { enabled: false }  # Disable public patterns
```

## Loading Custom Config

### CLI
```bash
# Custom config path (auto-loaded from ~/.promptshield/patterns.yaml)
promptshield redact -i file.txt
```

### Python API
```python
from promptshield import Redactor
import yaml

# Patterns are auto-loaded from ~/.promptshield/patterns.yaml
redactor = Redactor()

# Or load from custom file:
with open('/path/to/custom.yaml') as f:
    config = yaml.safe_load(f)
# (Phase 2: programmatic config loading)
```

## Troubleshooting

### False Positives

If legitimate patterns are being flagged:

1. Check which patterns are matching:
   ```bash
   promptshield scan -i file.txt --json | jq '.findings'
   ```

2. Adjust patterns.yaml to be more specific:
   ```yaml
   api_keys:
     my_provider:
       - regex: "^token_[a-zA-Z0-9]{32}$"  # More specific
   ```

3. Disable categories you don't need:
   ```yaml
   pii:
     credit_card: { enabled: false }
   ```

### Missing Patterns

If you're not detecting a secret format:

1. Add to patterns.yaml:
   ```yaml
   api_keys:
     new_provider:
       - regex: "^new_[a-zA-Z0-9]{40}$"
   ```

2. Test:
   ```bash
   echo "My key is new_abc123..." | promptshield scan -i /dev/stdin
   ```

## Best Practices

1. **Review before committing** — Always check detection results before redacting
2. **Start strict** — Enable all patterns, then disable false positives
3. **Version your config** — Keep patterns.yaml in version control
4. **Test regularly** — Add new providers as you discover them
5. **Document custom patterns** — Explain why each regex exists

## Version Support

- PromptShield 0.1.0+: Supports YAML patterns from `~/.promptshield/patterns.yaml`
- PromptShield 0.2.0+: Programmatic config API (planned)
- PromptShield 1.0.0+: Full pattern inheritance and schema validation (planned)
