"""
API Key Detection Patterns

Detects common API key formats from:
- OpenAI (sk-, sk-proj-)
- AWS (AKIA, ASIA)
- Google (AIza)
- Stripe (sk_live_, rk_live_)
- GitHub (ghp_, ghu_, ghs_, gho_)
- Anthropic (sk-ant-)
"""

import re
from typing import Dict, List, NamedTuple

class APIKeyMatch(NamedTuple):
    """Result of an API key detection."""
    provider: str
    matched: str
    start: int
    end: int

class APIKeyDetector:
    """Detect common API key patterns."""
    
    # Provider-specific patterns (prefix + length hints)
    PATTERNS = {
        "openai": [
            (r"sk-proj-[a-zA-Z0-9\-_]{32,}", "OpenAI Project Key"),
            (r"sk-[a-zA-Z0-9]{48,}", "OpenAI API Key"),
        ],
        "aws": [
            (r"AKIA[0-9A-Z]{16}", "AWS Access Key"),
            (r"ASIA[0-9A-Z]{16}", "AWS Temporary Access Key"),
        ],
        "google": [
            (r"AIza[0-9A-Za-z\-_]{35}", "Google API Key"),
        ],
        "stripe": [
            (r"sk_live_[a-zA-Z0-9]{24,}", "Stripe Live Secret"),
            (r"rk_live_[a-zA-Z0-9]{24,}", "Stripe Live Restricted"),
            (r"pk_live_[a-zA-Z0-9]{24,}", "Stripe Live Public"),
        ],
        "github": [
            (r"ghp_[a-zA-Z0-9]{36,255}", "GitHub Personal Access Token"),
            (r"ghu_[a-zA-Z0-9]{36,255}", "GitHub OAuth Token"),
            (r"ghs_[a-zA-Z0-9]{36,255}", "GitHub Server-to-Server Token"),
            (r"gho_[a-zA-Z0-9]{36,255}", "GitHub OAuth App Token"),
        ],
        "anthropic": [
            (r"sk-ant-[a-zA-Z0-9\-_]{32,}", "Anthropic API Key"),
        ],
        "huggingface": [
            (r"hf_[a-zA-Z0-9]{34,}", "Hugging Face Token"),
        ],
    }
    
    def __init__(self):
        """Compile regex patterns for efficiency."""
        self.compiled = {}
        for provider, patterns in self.PATTERNS.items():
            self.compiled[provider] = [
                (re.compile(regex), label) for regex, label in patterns
            ]
    
    def detect(self, text: str) -> List[APIKeyMatch]:
        """
        Detect API keys in text.
        
        Args:
            text: Input text to scan
            
        Returns:
            List of APIKeyMatch objects
        """
        matches = []
        for provider, patterns in self.compiled.items():
            for regex, label in patterns:
                for match in regex.finditer(text):
                    matches.append(
                        APIKeyMatch(
                            provider=provider,
                            matched=match.group(0),
                            start=match.start(),
                            end=match.end(),
                        )
                    )
        
        # Sort by position for consistent ordering
        matches.sort(key=lambda m: m.start)
        return matches
    
    def has_api_keys(self, text: str) -> bool:
        """Check if text contains any API keys."""
        return len(self.detect(text)) > 0
