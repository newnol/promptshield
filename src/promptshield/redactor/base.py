"""
Redactor: Replace detected sensitive data with placeholders.
"""

from typing import List, Dict
from ..detector.api_keys import APIKeyDetector
from ..detector.pii import PIIDetector

class Redactor:
    """Redact sensitive data from text."""
    
    def __init__(self, patterns: List[str] = None):
        """
        Initialize redactor.
        
        Args:
            patterns: Which patterns to redact
                     'api_keys', 'pii' or custom list (default: both)
        """
        self.patterns = patterns or ['api_keys', 'pii']
        self.api_detector = APIKeyDetector() if 'api_keys' in self.patterns else None
        self.pii_detector = PIIDetector() if 'pii' in self.patterns else None
    
    def redact(self, text: str, placeholder_prefix: str = "[") -> tuple:
        """
        Redact sensitive data from text.
        
        Args:
            text: Input text
            placeholder_prefix: Prefix for placeholders (e.g., "[", "{")
            
        Returns:
            (redacted_text, redaction_report)
        """
        redactions = []
        offset = 0
        result = text
        
        # Detect and redact API keys
        if self.api_detector:
            api_keys = self.api_detector.detect(text)
            for match in api_keys:
                placeholder = f"{placeholder_prefix}API_KEY_{match.provider.upper()}]"
                start = match.start + offset
                end = match.end + offset
                result = result[:start] + placeholder + result[end:]
                offset += len(placeholder) - (match.end - match.start)
                redactions.append({
                    'type': 'API_KEY',
                    'provider': match.provider,
                    'original_length': len(match.matched)
                })
        
        # Detect and redact PII
        if self.pii_detector:
            pii = self.pii_detector.detect(result)  # Scan the updated text
            for match in pii:
                placeholder = f"{placeholder_prefix}{match.category.upper()}]"
                start = match.start + offset
                end = match.end + offset
                result = result[:start] + placeholder + result[end:]
                offset += len(placeholder) - (match.end - match.start)
                redactions.append({
                    'type': 'PII',
                    'category': match.category,
                    'original_length': len(match.matched)
                })
        
        return result, {
            'redactions_count': len(redactions),
            'items': redactions,
            'original_text_length': len(text),
            'redacted_text_length': len(result),
        }
