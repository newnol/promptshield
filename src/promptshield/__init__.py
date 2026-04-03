"""
PromptShield: Open-source tool to redact sensitive data and compress prompts.

Main exports:
- Redactor: Redact API keys and PII
- Compressor: Compress tokens in prompts
- Scanner: Scan for leaks without redacting
- PromptPipeline: Combined pipeline (scan + redact + compress)
"""

__version__ = "0.1.0"
__author__ = "PromptShield Contributors"

from .redactor.base import Redactor
from .compressor.base import Compressor
from .detector.scanner import Scanner
from .pipeline import PromptPipeline

__all__ = [
    "Redactor",
    "Compressor",
    "Scanner",
    "PromptPipeline",
]
