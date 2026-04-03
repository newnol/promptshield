"""Tests for compression."""

import pytest
from promptshield.compressor.base import Compressor

class TestCompressor:
    """Test compression logic."""
    
    def test_token_counting(self):
        compressor = Compressor()
        text = "Hello, world!"
        tokens = compressor.count_tokens(text)
        assert tokens > 0
    
    def test_markdown_stripping(self):
        compressor = Compressor()
        text = "This is **bold** and *italic* text."
        compressed, stats = compressor.compress(text)
        
        # Should have fewer tokens
        assert stats['tokens_after'] <= stats['tokens_before']
        # Bold/italic markers should be removed
        assert "**" not in compressed or "*" not in compressed
    
    def test_compression_stats(self):
        compressor = Compressor()
        text = "# Heading\n\n**Bold text** with markdown formatting and extra    spaces."
        compressed, stats = compressor.compress(text)
        
        assert 'tokens_before' in stats
        assert 'tokens_after' in stats
        assert 'saved_percentage' in stats
        assert stats['tokens_before'] >= stats['tokens_after']
