"""
PromptPipeline: Combined workflow for scanning, redacting, and compressing.
"""

from typing import Dict, List
from .detector.scanner import Scanner
from .redactor.base import Redactor
from .compressor.base import Compressor

class PromptPipeline:
    """Full pipeline: scan → redact → compress."""
    
    def __init__(self, steps: List[str] = None, benchmark: bool = True):
        """
        Initialize pipeline.
        
        Args:
            steps: Pipeline steps ('scan', 'redact', 'compress')
            benchmark: Track before/after metrics
        """
        self.steps = steps or ['scan', 'redact', 'compress']
        self.benchmark = benchmark
        
        self.scanner = Scanner()
        self.redactor = Redactor()
        self.compressor = Compressor()
    
    def process(self, text: str) -> Dict:
        """
        Process text through pipeline.
        
        Returns:
            {
                'original_text': str,
                'final_text': str,
                'scan': {...},
                'redaction': {...},
                'compression': {...},
                'benchmark': {...}
            }
        """
        result = {
            'original_text': text,
            'benchmark': {}
        }
        
        current_text = text
        
        # Scan for leaks
        if 'scan' in self.steps:
            result['scan'] = self.scanner.scan(text)
        
        # Redact
        if 'redact' in self.steps:
            current_text, redaction_info = self.redactor.redact(current_text)
            result['redaction'] = redaction_info
        
        # Compress
        if 'compress' in self.steps:
            current_text, compression_info = self.compressor.compress(current_text)
            result['compression'] = compression_info
        
        result['final_text'] = current_text
        
        # Benchmark
        if self.benchmark:
            result['benchmark'] = {
                'original_length': len(text),
                'final_length': len(current_text),
                'original_tokens': self.compressor.count_tokens(text),
                'final_tokens': self.compressor.count_tokens(current_text),
            }
        
        return result
