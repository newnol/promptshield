#!/usr/bin/env python3
"""Sync API key rules from detector source to web runtime JSON."""

from pathlib import Path
import shutil


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    source = repo_root / "src" / "promptshield" / "detector" / "api_key_rules.json"
    target = repo_root / "web" / "api_key_rules.json"

    if not source.exists():
        raise FileNotFoundError(f"Source rules not found: {source}")

    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    print(f"Synced rules: {source} -> {target}")


if __name__ == "__main__":
    main()
