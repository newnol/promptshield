# Frequently Asked Questions

## General

**Q: Is PromptShield free?**
A: Yes, it's 100% free and open source (MIT License).

**Q: Does PromptShield send my data anywhere?**
A: No. Everything runs locally on your machine. No cloud, no telemetry, no tracking.

**Q: How accurate is the detection?**
A: Very accurate for known patterns (API keys are prefix-based). For custom patterns, you can define them via YAML config.

**Q: What's the difference from CleanMyPrompt?**
A: PromptShield is open source, CLI-first, with a Python API and custom pattern support. CleanMyPrompt is closed-source but has a nice UI.

---

## Installation

**Q: I get `ModuleNotFoundError: No module named promptshield`**
A: Make sure you ran `pip install promptshield` and you're using the same Python environment.

**Q: Can I use it in a virtual environment?**
A: Yes, that's recommended:
```bash
python3 -m venv venv
source venv/bin/activate
pip install promptshield
```

**Q: Does it work on Windows?**
A: Yes, PromptShield works on Windows, macOS, and Linux.

---

## CLI Usage

**Q: How do I scan multiple files?**
A: Use a loop:
```bash
for file in *.py; do
  promptshield scan -i "$file"
done
```

**Q: Can I pipe input?**
A: Yes:
```bash
cat app.log | promptshield scan -i /dev/stdin
```

**Q: How do I save the JSON output?**
A: Use `--json` flag:
```bash
promptshield scan -i file.py --json > report.json
```

**Q: The tool detected a false positive. How do I exclude it?**
A: Update `~/.promptshield/patterns.yaml` to disable the pattern or make it more specific. See [Configuration](configuration.md).

---

## Python API

**Q: How do I use PromptShield in my application?**
A: Import and use:
```python
from promptshield import PromptPipeline

pipeline = PromptPipeline()
result = pipeline.process(user_input)
```

**Q: Can I customize the placeholder text?**
A: Currently no, but it's on the roadmap for Phase 2. You can modify the source if needed.

**Q: What if I only want to redact, not compress?**
A: Use the `Redactor` class directly:
```python
from promptshield import Redactor

redactor = Redactor()
clean, report = redactor.redact(text)
```

**Q: Can I get just the API keys without PII?**
A: Yes:
```python
from promptshield import Redactor

redactor = Redactor(patterns=['api_keys'])
clean, report = redactor.redact(text)
```

---

## Detection & Patterns

**Q: Which API key providers are supported?**
A: OpenAI, AWS, Google, Stripe, GitHub, Anthropic, Hugging Face. Add custom providers via patterns.yaml.

**Q: How do I add a custom pattern?**
A: Edit `~/.promptshield/patterns.yaml`:
```yaml
api_keys:
  my_provider:
    - prefix: "mytoken_"
      min_length: 20
```

**Q: Why isn't my API key being detected?**
A: Check:
1. Is the pattern correct? (run `promptshield scan -i file.txt`)
2. Does it match the provider prefix? (e.g., OpenAI keys start with `sk-`)
3. Is it long enough? (most keys have minimum lengths)

Add debug via patterns.yaml with more specific regex.

**Q: Can I detect secrets that aren't API keys?**
A: Yes, add custom regex patterns:
```yaml
pii:
  employee_id:
    - regex: "^EMP[0-9]{6}$"
```

---

## Security & Privacy

**Q: Is PromptShield secure?**
A: PromptShield uses simple regex pattern matching—no ML models needed. It's deterministic and auditable. But always review before redacting in production.

**Q: What if I have a zero-day secret format?**
A: PromptShield won't detect it. Use `--review` mode (Phase 2) to manually confirm redactions, or add a custom pattern.

**Q: Can I use PromptShield in a compliance-sensitive environment?**
A: Yes, it's self-hosted and offline. See [Configuration](configuration.md) for enterprise setup.

**Q: Will PromptShield work in an air-gapped environment?**
A: Yes, it needs no internet. Just install via pip once and you're good.

---

## Performance

**Q: How fast is PromptShield?**
A: ~1ms per KB for detection, ~2ms per KB for redaction, ~5-10ms per KB for compression (includes tiktoken).

**Q: Can I process large files (100MB+)?**
A: For very large files, use batch processing or process in chunks. See [Examples](examples.md).

**Q: Does compression really save tokens?**
A: Yes, typically 15-40% depending on your input (markdown, whitespace, filler text).

**Q: What encoding does it use for token counting?**
A: `cl100k_base` (GPT-3.5/4). Other encodings are configurable.

---

## Integration

**Q: How do I integrate with GitHub Actions?**
A: See [Examples](examples.md#github-action) for a sample workflow.

**Q: Can I use PromptShield in a pre-commit hook?**
A: Yes, see [Examples](examples.md#pre-commit-hook).

**Q: Does PromptShield have a REST API?**
A: Not yet, but it's planned for Phase 2. For now, use the Python API or CLI.

**Q: Will there be a browser extension?**
A: Yes, planned for Phase 2.

---

## Contributing

**Q: How can I contribute?**
A: See [CONTRIBUTING.md](CONTRIBUTING.md). We accept:
- Bug reports
- Feature requests
- API key pattern additions
- Documentation improvements
- Tests

**Q: Can I add detection for a new provider?**
A: Yes! It's easy:
1. Add a pattern to `src/promptshield/detector/api_keys.py`
2. Add a test
3. Submit a PR

---

## Roadmap

**Q: When will web UI be available?**
A: Phase 2 (Q2 2026). Follow [Roadmap](roadmap.md) for updates.

**Q: Is there a cloud version?**
A: Not yet. Phase 3 (Q3-Q4 2026) includes an optional cloud version for teams.

**Q: What about IDE plugins?**
A: Stretch goal for future phases.

---

## Troubleshooting

**Q: I get `No such file or directory` error**
A: Check the file path:
```bash
ls -la /path/to/file.txt
promptshield scan -i /path/to/file.txt
```

**Q: The CLI won't run after installation**
A: Try:
```bash
python -m promptshield.cli scan -i file.txt
```

Or reinstall:
```bash
pip install --upgrade promptshield
```

**Q: Tests are failing in my environment**
A: Make sure all dependencies are installed:
```bash
pip install -e ".[dev]"
pytest tests/
```

---

## Still have questions?

- 📚 Check the [docs](.)
- 💬 Open a [GitHub Discussion](https://github.com/newnol/promptshield/discussions)
- 🐛 Report a [bug](https://github.com/newnol/promptshield/issues)
- 📧 Email: hello@promptshield.dev (Phase 2)

---

_Last updated: April 2026_
