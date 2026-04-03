"""
PromptShield CLI

Commands:
  scan      - Detect leaks without redacting
  redact    - Redact sensitive data
  compress  - Compress tokens
  process   - Full pipeline (scan + redact + compress)
"""

import click
import json
from pathlib import Path
from ..scanner import Scanner
from ..redactor.base import Redactor
from ..compressor.base import Compressor
from ..pipeline import PromptPipeline

@click.group()
def cli():
    """PromptShield: Redact & Compress Prompts"""
    pass

@cli.command()
@click.option('--input', '-i', type=click.File('r'), required=True, help='Input file')
@click.option('--output', '-o', type=click.File('w'), help='Output file')
@click.option('--json', is_flag=True, help='Output as JSON')
def scan(input, output, json_flag):
    """Scan for leaks without redacting."""
    text = input.read()
    scanner = Scanner()
    result = scanner.scan(text)
    
    if json_flag:
        output_text = json.dumps(result, indent=2)
    else:
        output_text = _format_scan_report(result)
    
    if output:
        output.write(output_text)
    else:
        click.echo(output_text)

@cli.command()
@click.option('--input', '-i', type=click.File('r'), required=True, help='Input file')
@click.option('--output', '-o', type=click.File('w'), help='Output file')
@click.option('--patterns', '-p', multiple=True, default=['api_keys', 'pii'], help='Patterns to redact')
def redact(input, output, patterns):
    """Redact sensitive data."""
    text = input.read()
    redactor = Redactor(patterns=list(patterns))
    redacted, report = redactor.redact(text)
    
    if output:
        output.write(redacted)
    else:
        click.echo(redacted)
    
    click.echo(f"\n[Report] {report['redactions_count']} redactions", err=True)

@cli.command()
@click.option('--input', '-i', type=click.File('r'), required=True, help='Input file')
@click.option('--output', '-o', type=click.File('w'), help='Output file')
def compress(input, output, json_flag):
    """Compress tokens."""
    text = input.read()
    compressor = Compressor()
    compressed, stats = compressor.compress(text)
    
    if output:
        output.write(compressed)
    else:
        click.echo(compressed)
    
    click.echo(f"\n[Stats] Tokens: {stats['tokens_before']} → {stats['tokens_after']} ({stats['saved_percentage']}% saved)", err=True)

@cli.command()
@click.option('--input', '-i', type=click.File('r'), required=True, help='Input file')
@click.option('--output', '-o', type=click.File('w'), help='Output file')
@click.option('--benchmark', is_flag=True, help='Show benchmarks')
def process(input, output, benchmark):
    """Full pipeline: scan + redact + compress."""
    text = input.read()
    pipeline = PromptPipeline(benchmark=benchmark)
    result = pipeline.process(text)
    
    if output:
        output.write(result['final_text'])
    else:
        click.echo(result['final_text'])
    
    click.echo(f"\n[Summary]", err=True)
    if 'scan' in result:
        click.echo(f"  Leaks found: {result['scan']['total_findings']}", err=True)
    if 'redaction' in result:
        click.echo(f"  Redactions: {result['redaction']['redactions_count']}", err=True)
    if 'compression' in result:
        click.echo(f"  Tokens: {result['compression']['tokens_before']} → {result['compression']['tokens_after']} ({result['compression']['saved_percentage']}% saved)", err=True)

def _format_scan_report(result):
    """Format scan report as plain text."""
    lines = []
    lines.append("=== Scan Report ===\n")
    
    if result['is_safe']:
        lines.append("✓ No sensitive data detected\n")
    else:
        lines.append(f"⚠ Found {result['total_findings']} potential issues:\n")
        
        if result['api_keys']:
            lines.append("API Keys:")
            for ak in result['api_keys']:
                lines.append(f"  - {ak['provider'].upper()} @ line {ak['position']}")
        
        if result['pii']:
            lines.append("PII:")
            for p in result['pii']:
                lines.append(f"  - {p['category']} @ line {p['position']}")
    
    return '\n'.join(lines)

if __name__ == '__main__':
    cli()
