"""
Scanner: Unified interface for detecting all sensitive data without redacting.
"""

from typing import Dict, List
from .api_keys import APIKeyDetector
from .pii import PIIDetector

class Scanner:
    """Scan text for sensitive data without redacting."""
    
    def __init__(self, pii_categories: List[str] = None):
        """
        Initialize scanner.
        
        Args:
            pii_categories: PII categories to scan (default: all)
        """
        self.api_detector = APIKeyDetector()
        self.pii_detector = PIIDetector(enabled_categories=pii_categories)
    
    def scan(self, text: str) -> Dict:
        """
        Scan text for all sensitive data.
        
        Returns:
            {
                'api_keys': [...],
                'pii': [...],
                'total_findings': int,
                'is_safe': bool
            }
        """
        api_keys = self.api_detector.detect(text)
        pii = self.pii_detector.detect(text)
        
        return {
            'api_keys': [
                {
                    'provider': m.provider,
                    'snippet': m.matched[:10] + '***' if len(m.matched) > 10 else '***',
                    'position': m.start
                }
                for m in api_keys
            ],
            'pii': [
                {
                    'category': m.category,
                    'snippet': '***',
                    'position': m.start
                }
                for m in pii
            ],
            'total_findings': len(api_keys) + len(pii),
            'is_safe': (len(api_keys) + len(pii)) == 0,
        }
