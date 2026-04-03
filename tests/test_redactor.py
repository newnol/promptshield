"""Tests for redaction."""

import pytest
from promptshield.redactor.base import Redactor

class TestRedactor:
    """Test redaction logic."""
    
    def test_api_key_redaction(self):
        redactor = Redactor(patterns=['api_keys'])
        text = "My API key is sk-proj-abc123def456ghi789"
        redacted, report = redactor.redact(text)
        
        # Check that the original key is not in output
        assert "sk-proj-" not in redacted or "abc123" not in redacted
        assert report['redactions_count'] > 0
    
    def test_pii_redaction(self):
        redactor = Redactor(patterns=['pii'])
        text = "My SSN is 123-45-6789"
        redacted, report = redactor.redact(text)
        
        # Check that redaction happened
        assert report['redactions_count'] > 0
    
    def test_no_redaction_when_disabled(self):
        redactor = Redactor(patterns=[])
        text = "My SSN is 123-45-6789"
        redacted, report = redactor.redact(text)
        
        # No patterns enabled, so no redactions
        assert report['redactions_count'] == 0
        assert text == redacted
