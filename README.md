# PromptShield 🛡️

**Open-source tool to redact sensitive data (API keys, PII) and compress prompts before sending to LLMs.**

No cloud, no tracking, 100% local. Inspired by CleanMyPrompt but fully open, extensible, and built for DevOps pipelines.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/newnol/promptshield)

**Deploy (non-technical):** click the button above, sign in with GitHub, then **Deploy**. This repo includes `vercel.json` so Vercel serves the static UI from the `web/` folder automatically—no need to pick a root directory.

## Quick Start

### Installation
```bash
pip install promptshield
```

### Web MVP (Client-only)
```bash
cd web
python3 -m http.server 8080
# Open http://localhost:8080
```

The web MVP runs entirely in your browser. It focuses on pruning/redacting API keys, optional PII, and log secrets — plus a log-to-AI prompt builder that extracts the useful error blocks and trims noise.

To keep web rules in sync with detector rules:
```bash
python3 scripts/sync_api_key_rules.py
```

### Basic Usage

#### CLI
```bash
# Scan for leaks (no redaction)
promptshield scan --input code.py

# Redact sensitive data
promptshield redact --input prompt.txt --output clean.txt

# Compress tokens (up to 40% savings)
promptshield compress --input prompt.txt --output compressed.txt

# Full pipeline: detect + redact + compress
promptshield process --input prompt.txt --benchmark
```

#### Python API
```python
from promptshield import Redactor, Compressor, Scanner

# Detect leaks
scanner = Scanner()
leaks = scanner.scan("My API key is sk-proj-abc123...")
# → [{'type': 'API_KEY', 'provider': 'openai', 'matched': 'sk-proj-abc123'}]

# Redact
redactor = Redactor(patterns=['openai', 'aws', 'pii'])
clean = redactor.redact(prompt_text)

# Compress
compressor = Compressor()
compressed, stats = compressor.compress(clean)
print(stats)  # {'tokens_before': 200, 'tokens_after': 120, 'saved_pct': 40}
```

## Features

- ✅ **API Key Detection**: OpenAI, AWS, Google, Stripe, GitHub, custom patterns
- ✅ **PII Redaction**: SSN, email, phone, credit cards, crypto addresses, IBAN
- ✅ **Token Compression**: Strip markdown, whitespace, verbose text (~40% savings)
- ✅ **Log-to-Prompt Extraction**: Paste raw container/app logs and get a compact AI-ready debug prompt
- ✅ **Fully Offline**: No cloud, no API calls, runs locally
- ✅ **Extensible**: YAML-based custom detection patterns
- ✅ **CLI + Python API**: Use standalone or integrate into your code
- ✅ **Benchmarking**: Before/after token counts and redaction reports
- ✅ **Zero Dependencies** (core): Only tiktoken, pyyaml, click for CLI

## Architecture

```
promptshield/
├── detector/          # Pattern matching (API keys, PII)
│   ├── api_keys.py
│   ├── pii.py
│   └── custom.py
├── redactor/          # Redaction logic + placeholders
│   ├── base.py
│   └── preservers.py  # Optional: maintain code structure
├── compressor/        # Token optimization
│   ├── base.py
│   ├── markdown_stripper.py
│   └── token_counter.py
├── cli/               # Command-line interface
│   └── main.py
├── config/            # Default patterns
│   └── patterns.yaml
└── __init__.py        # Public API exports
```

## Roadmap

### Phase 1 (MVP - Done)
- [x] Project structure
- [x] Documentation
- [ ] Core detector (API keys, PII patterns)
- [ ] Core redactor (placeholder replacement)
- [ ] Basic compressor (markdown + whitespace)
- [ ] CLI scaffold

### Phase 2 (Production)
- [x] Web UI (client-side static MVP)
- [ ] REST API server
- [ ] Browser extension (Chrome/Firefox)
- [ ] MCP (Model Context Protocol) support
- [ ] Advanced compression (LLM-based rewrite)

### Phase 3 (Enterprise)
- [ ] Cloud-hosted version (optional)
- [ ] Audit logging
- [ ] Team collaboration
- [ ] Webhook integrations

## Configuration

Create `~/.promptshield/patterns.yaml`:

```yaml
patterns:
  api_keys:
    openai:
      - prefix: "sk-"
        min_length: 40
    aws:
      - prefix: "AKIA"
      - prefix: "ASIA"
    custom:
      - regex: "^auth_[a-zA-Z0-9]{32}$"
  
  pii:
    ssn:
      - regex: '\d{3}-\d{2}-\d{4}'
    credit_card:
      - regex: '\b\d{13,16}\b'
    email:
      - regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
```

## Security & Privacy

- **No telemetry**: PromptShield never phones home
- **No external calls**: Everything runs on your machine
- **Regex-based**: Fast pattern matching, no ML models needed
- **Reproducible**: Same input = same output (deterministic)

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./docs/contributing.md)

## License

MIT License — See [LICENSE](./LICENSE)

## FAQ

**Q: Will my data be sent anywhere?**
A: No. Everything runs locally. No cloud, no API calls.

**Q: How accurate is the detection?**
A: Very accurate for known patterns (prefix-based). Custom patterns are user-defined regex.

**Q: Can I use this in production?**
A: Yes, but review the CONTRIBUTING guide for hardening recommendations.

**Q: What about false positives?**
A: Use `--review` mode to manually confirm before redacting, or adjust patterns.yaml.

---

Made with 🛡️ for developers, security teams, and anyone who wants AI without leaking secrets.
