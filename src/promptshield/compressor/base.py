"""
Compressor: Reduce token count by removing unnecessary elements.
"""

import re
import tiktoken
from typing import Tuple, Dict

class Compressor:
    """Compress prompts to reduce token count."""
    
    def __init__(self, encoding: str = "cl100k_base"):
        """
        Initialize compressor.
        
        Args:
            encoding: Tiktoken encoding to use (default: GPT-3.5/4)
        """
        self.encoding = tiktoken.get_encoding(encoding)
    
    def count_tokens(self, text: str) -> int:
        """Count tokens using tiktoken."""
        return len(self.encoding.encode(text))
    
    def compress(self, text: str) -> Tuple[str, Dict]:
        """
        Compress text by removing unnecessary elements.
        
        Args:
            text: Input text to compress
            
        Returns:
            (compressed_text, stats)
        """
        tokens_before = self.count_tokens(text)
        
        # Strip markdown syntax
        compressed = self._strip_markdown(text)
        
        # Remove extra whitespace
        compressed = self._clean_whitespace(compressed)
        
        # Remove common filler words (optional, light version)
        compressed = self._remove_filler(compressed)
        
        tokens_after = self.count_tokens(compressed)
        saved = tokens_before - tokens_after
        saved_pct = (saved / tokens_before * 100) if tokens_before > 0 else 0
        
        return compressed, {
            'tokens_before': tokens_before,
            'tokens_after': tokens_after,
            'tokens_saved': saved,
            'saved_percentage': round(saved_pct, 2),
        }
    
    def _strip_markdown(self, text: str) -> str:
        """Remove markdown formatting."""
        # Remove bold/italic
        text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
        text = re.sub(r'__([^_]+)__', r'\1', text)
        text = re.sub(r'\*([^\*]+)\*', r'\1', text)
        text = re.sub(r'_([^_]+)_', r'\1', text)
        
        # Remove code blocks (keep content)
        text = re.sub(r'```[\s\S]*?```', lambda m: m.group(0).split('\n', 1)[1].rsplit('\n', 1)[0] if '\n' in m.group(0) else '', text)
        text = re.sub(r'`([^`]+)`', r'\1', text)
        
        # Remove headings
        text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
        
        # Remove links [text](url) → text
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
        
        # Remove horizontal rules
        text = re.sub(r'^[\-\*_]{3,}$', '', text, flags=re.MULTILINE)
        
        return text
    
    def _clean_whitespace(self, text: str) -> str:
        """Remove excess whitespace."""
        # Multiple blank lines → single blank line
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Trailing whitespace
        text = '\n'.join(line.rstrip() for line in text.split('\n'))
        
        # Remove leading whitespace after newlines (but preserve structure)
        text = re.sub(r'\n\s+', '\n', text)
        
        return text.strip()
    
    def _remove_filler(self, text: str) -> str:
        """Remove common filler phrases (conservative)."""
        fillers = [
            r'\b(very\s+)+(important|critical|essential)\b',
            r'\b(please|kindly)\s+',
            r'\bI\s+(would\s+)?like\s+to\s+',
        ]
        
        result = text
        for filler in fillers:
            result = re.sub(filler, '', result, flags=re.IGNORECASE)
        
        return result
