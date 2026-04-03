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

import json
import re
from pathlib import Path
from typing import Dict, List, NamedTuple, Tuple

class APIKeyMatch(NamedTuple):
    """Result of an API key detection."""
    provider: str
    matched: str
    start: int
    end: int

class APIKeyDetector:
    """Detect common API key patterns."""

    RULES_FILE = Path(__file__).with_name("api_key_rules.json")

    def __init__(self):
        """Compile regex patterns for efficiency."""
        self.patterns = self._load_patterns()
        self.compiled = {}
        for provider, patterns in self.patterns.items():
            self.compiled[provider] = [
                (re.compile(regex), label) for regex, label in patterns
            ]

    def _load_patterns(self) -> Dict[str, List[Tuple[str, str]]]:
        """
        Load API key rules from JSON for easy provider extension.

        Expected JSON format:
        {
          "provider_name": [{"regex": "...", "label": "..."}]
        }
        """
        with open(self.RULES_FILE, "r", encoding="utf-8") as fh:
            data = json.load(fh)

        patterns: Dict[str, List[Tuple[str, str]]] = {}
        for provider, provider_rules in data.items():
            parsed_rules = []
            for rule in provider_rules:
                regex = rule.get("regex")
                label = rule.get("label", provider)
                if not regex:
                    continue
                parsed_rules.append((regex, label))

            if parsed_rules:
                patterns[provider] = parsed_rules

        return patterns
    
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
