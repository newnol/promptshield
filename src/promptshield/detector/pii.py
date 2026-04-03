"""
PII (Personally Identifiable Information) Detection Patterns

Detects:
- Social Security Numbers (SSN)
- Credit Card Numbers
- Email addresses
- Phone numbers
- Cryptocurrency addresses
- IBAN numbers
- Dates of birth
"""

import re
from typing import NamedTuple, List

class PIIMatch(NamedTuple):
    """Result of a PII detection."""
    category: str
    matched: str
    start: int
    end: int

class PIIDetector:
    """Detect common PII patterns."""
    
    PATTERNS = {
        "ssn": [
            (r"\b\d{3}-\d{2}-\d{4}\b", "Social Security Number"),
        ],
        "credit_card": [
            (r"\b\d{13,16}\b", "Credit Card Number (Luhn check recommended)"),
        ],
        "email": [
            (r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b", "Email Address"),
        ],
        "phone": [
            (r"\b\+?1?\s?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b", "US Phone Number"),
            (r"\b\+[0-9]{1,3}\s?[0-9\s\-\(\)]{7,14}\b", "International Phone"),
        ],
        "bitcoin_address": [
            (r"\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b", "Bitcoin Address (P2PKH)"),
            (r"\bbc1[a-z0-9]{39,59}\b", "Bitcoin Address (Bech32)"),
        ],
        "ethereum_address": [
            (r"\b0x[a-fA-F0-9]{40}\b", "Ethereum Address"),
        ],
        "iban": [
            (r"\b[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}\b", "IBAN Number"),
        ],
        "date_of_birth": [
            (r"\b(0?[1-9]|[12][0-9]|3[01])[-/](0?[1-9]|1[0-2])[-/](19|20)\d{2}\b", "Date (MM/DD/YYYY)"),
        ],
    }
    
    def __init__(self, enabled_categories: List[str] = None):
        """
        Initialize PII detector.
        
        Args:
            enabled_categories: List of categories to detect. None = all.
        """
        self.enabled = enabled_categories or list(self.PATTERNS.keys())
        self.compiled = {}
        
        for category in self.enabled:
            if category in self.PATTERNS:
                patterns = self.PATTERNS[category]
                self.compiled[category] = [
                    (re.compile(regex), label) for regex, label in patterns
                ]
    
    def detect(self, text: str) -> List[PIIMatch]:
        """
        Detect PII in text.
        
        Args:
            text: Input text to scan
            
        Returns:
            List of PIIMatch objects
        """
        matches = []
        for category, patterns in self.compiled.items():
            for regex, label in patterns:
                for match in regex.finditer(text):
                    matches.append(
                        PIIMatch(
                            category=category,
                            matched=match.group(0),
                            start=match.start(),
                            end=match.end(),
                        )
                    )
        
        # Sort by position
        matches.sort(key=lambda m: m.start)
        return matches
    
    def has_pii(self, text: str) -> bool:
        """Check if text contains any PII."""
        return len(self.detect(text)) > 0
