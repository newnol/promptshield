# Contributing to PromptShield

We ❤️ contributions! This guide will help you get started.

## Code of Conduct

Be respectful, inclusive, and professional. We're building a tool for security—let's model that in our community.

## Getting Started

### 1. Fork & Clone
```bash
git clone https://github.com/newnol/promptshield.git
cd promptshield
```

### 2. Set Up Development Environment
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dev dependencies
pip install -e ".[dev,docs]"
```

### 3. Run Tests
```bash
pytest tests/ -v
pytest tests/ --cov=promptshield  # With coverage
```

### 4. Run Linting
```bash
black src/
isort src/
flake8 src/
mypy src/
```

## Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/bug-description
```

### 2. Make Changes
- Follow the code structure:
  ```
  src/promptshield/
  ├── detector/       # Detection logic
  ├── redactor/       # Redaction logic
  ├── compressor/     # Compression logic
  ├── cli/            # CLI commands
  └── __init__.py     # Public API
  ```

- Add tests for new code
- Update docstrings (Google style)
- Run tests frequently

### 3. Write Tests
All new code should have tests:

```python
# tests/test_detector.py
def test_my_feature():
    result = my_feature("test_input")
    assert result == expected_output
```

### 4. Update Documentation
- Update README if user-facing
- Add docstrings to new functions
- Update CHANGELOG.md
- Consider adding examples/

### 5. Submit a Pull Request
```bash
git push origin feature/my-feature
```

Then [open a PR on GitHub](https://github.com/newnol/promptshield/pulls) with:
- Clear title
- Description of changes
- Link to any related issues
- Tests passing locally

## Areas We Need Help With

### High Priority
1. **API Key Patterns** — Add detection for new providers
   - File: `src/promptshield/detector/api_key_rules.json`
   - Add a new provider entry with one or more `{regex, label}` rules
   - Add test in `tests/test_detector.py`

2. **PII Detection Improvements**
   - Better regex patterns
   - Performance optimization
   - File: `src/promptshield/detector/pii.py`

3. **Documentation**
   - Examples
   - Troubleshooting guides
   - API docs
   - Directory: `docs/`

### Medium Priority
1. **Compression Algorithm**
   - Test various strategies
   - Benchmark performance
   - File: `src/promptshield/compressor/base.py`

2. **Error Handling**
   - Create `src/promptshield/errors.py`
   - Define custom exceptions
   - Add type hints

3. **Configuration System**
   - YAML loading
   - Pattern validation
   - Directory: `src/promptshield/config/`

### Lower Priority (Phase 2+)
- Web UI (SvelteKit)
- REST API
- Browser extension
- MCP integration

## Code Style

### Black + isort
```bash
# Auto-format
black src/ tests/
isort src/ tests/
```

### Type Hints
```python
# Always add type hints for public functions
def detect(self, text: str) -> List[Match]:
    """Detect patterns in text."""
    pass
```

### Docstrings (Google Style)
```python
def compress(self, text: str) -> Tuple[str, Dict]:
    """
    Compress text to reduce token count.
    
    Args:
        text: Input text to compress
        
    Returns:
        (compressed_text, stats_dict)
        
    Raises:
        PromptShieldError: If compression fails
    """
```

## Testing Requirements

- **Unit Tests**: Test individual functions
- **Integration Tests**: Test workflows (scan → redact → compress)
- **Edge Cases**: Empty strings, special characters, very long text
- **Performance**: Document token counts & timing

Minimum coverage: **70%** (goal: 85%+)

```bash
# Run with coverage
pytest tests/ --cov=promptshield --cov-report=html
```

## PR Review Process

1. **Automated Checks**
   - Tests pass ✅
   - Coverage maintained ✅
   - Linting passes ✅

2. **Code Review**
   - Does it solve the problem?
   - Is it performant?
   - Are there edge cases?
   - Is documentation clear?

3. **Merge** (once approved)
   - Squash or rebase commits?
   - Update CHANGELOG
   - Tag release (if ready)

## Reporting Issues

### Bug Report
```markdown
**Describe the bug**
A clear description of what happened.

**Reproduce**
1. Run this command
2. Observe this output

**Expected**
What should have happened

**Environment**
- OS: macOS 13
- Python: 3.10
- PromptShield: 0.1.0
```

### Feature Request
```markdown
**Motivation**
Why do we need this?

**Solution**
How should it work?

**Alternatives**
Are there other approaches?
```

## Performance Considerations

- **Detection**: Should be < 1ms per KB
- **Redaction**: Should be < 2ms per KB
- **Compression**: Should be < 10ms per KB (includes tiktoken)

Test performance:
```python
import time

text = "large text..."
start = time.time()
result = redactor.redact(text)
print(f"Time: {(time.time() - start) * 1000:.2f}ms")
```

## Security Considerations

Since PromptShield handles sensitive data:
- Never log sensitive data
- Sanitize error messages
- Use strong regex patterns (no ReDoS vulnerabilities)
- Validate all inputs
- Consider constant-time operations for comparisons

## Roadmap Collaboration

See [ROADMAP.md](./roadmap.md) for planned features. Interested in helping?
- Comment on issues
- Propose design in discussions
- Submit WIP PRs for feedback

## Questions?

- **GitHub Issues**: Ask in issue comments
- **Discussions**: [GitHub Discussions](https://github.com/newnol/promptshield/discussions)
- **Email**: hello@promptshield.dev

---

Thank you for contributing to PromptShield! 🛡️
