"""Tests for API key and PII detection."""

import pytest
from promptshield.detector.api_keys import APIKeyDetector
from promptshield.detector.pii import PIIDetector
from promptshield.detector.scanner import Scanner

class TestAPIKeyDetector:
    """Test API key detection."""
    
    def test_openai_key_detection(self):
        detector = APIKeyDetector()
        text = "My key is sk-proj-abc123def456ghi789jkl012mnopqr"
        matches = detector.detect(text)
        assert len(matches) > 0
        assert matches[0].provider == "openai"
    
    def test_aws_key_detection(self):
        detector = APIKeyDetector()
        text = "AWS key: AKIAIOSFODNN7EXAMPLE"
        matches = detector.detect(text)
        assert len(matches) > 0
        assert matches[0].provider == "aws"
    
    def test_no_false_positives(self):
        detector = APIKeyDetector()
        text = "This is just normal text without secrets"
        matches = detector.detect(text)
        assert len(matches) == 0

class TestPIIDetector:
    """Test PII detection."""
    
    def test_ssn_detection(self):
        detector = PIIDetector()
        text = "SSN: 123-45-6789"
        matches = detector.detect(text)
        assert len(matches) > 0
        assert matches[0].category == "ssn"
    
    def test_email_detection(self):
        detector = PIIDetector()
        text = "Contact me at john@example.com"
        matches = detector.detect(text)
        assert len(matches) > 0
        assert matches[0].category == "email"

class TestScanner:
    """Test unified scanner."""
    
    def test_combined_scan(self):
        scanner = Scanner()
        text = "Email: test@example.com, Key: sk-proj-abc123"
        result = scanner.scan(text)
        assert result['total_findings'] > 0
        assert not result['is_safe']
    
    def test_safe_text(self):
        scanner = Scanner()
        text = "This is just normal text"
        result = scanner.scan(text)
        assert result['total_findings'] == 0
        assert result['is_safe']
