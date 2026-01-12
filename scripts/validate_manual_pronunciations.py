#!/usr/bin/env python3
"""
Manual Pronunciations Validation Script

Validates manual_pronunciations.json for:
- Valid JSON syntax
- Required fields present
- No forbidden fields (like 'link')
- Basic pronunciation format consistency

Usage:
    python validate_manual_pronunciations.py
    
Exit codes:
    0: Validation passed
    1: Validation failed
"""

import json
import sys
import re
from pathlib import Path

MANUAL_FILE = "manual_pronunciations.json"

def validate_pronunciation_format(pronunciation: str, name: str) -> list:
    """
    Validate pronunciation follows BibleSpeak conventions.
    
    Args:
        pronunciation: Pronunciation string to validate
        name: Name this pronunciation belongs to (for error messages)
        
    Returns:
        List of validation error messages (empty if valid)
    """
    errors = []
    
    # Check for basic structure (contains hyphens for syllable separation)
    if '-' not in pronunciation and len(pronunciation) > 4:
        errors.append(f"  {name}: Missing hyphens for syllable separation")
    
    # Check for capitalization (should have some caps for emphasis)
    if pronunciation.isupper() or pronunciation.islower():
        errors.append(f"  {name}: Should use mixed case (CAPS for stressed syllables)")
    
    # Check for suspicious characters
    invalid_chars = set(pronunciation) - set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-')
    if invalid_chars:
        errors.append(f"  {name}: Contains unexpected characters: {invalid_chars}")
    
    return errors

def validate_manual_pronunciations() -> bool:
    """
    Validate manual_pronunciations.json file.
    
    Returns:
        True if validation passed, False otherwise
    """
    file_path = Path(MANUAL_FILE)
    
    # Check file exists
    if not file_path.exists():
        print(f"[OK] {MANUAL_FILE} not found (optional file)")
        return True
    
    print(f"Validating {MANUAL_FILE}...")
    
    # Check valid JSON
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON syntax: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Error reading file: {e}")
        return False
    
    # Check it's a dictionary
    if not isinstance(data, dict):
        print(f"[ERROR] Root element must be a JSON object/dictionary")
        return False
    
    # Validate each entry
    errors = []
    warnings = []
    
    for name, entry in data.items():
        # Check entry is a dictionary
        if not isinstance(entry, dict):
            errors.append(f"  {name}: Value must be an object/dictionary")
            continue
        
        # Check required field: 'pronunciation'
        if 'pronunciation' not in entry:
            errors.append(f"  {name}: Missing required field 'pronunciation'")
            continue
        
        # Check pronunciation is a string
        if not isinstance(entry['pronunciation'], str):
            errors.append(f"  {name}: 'pronunciation' must be a string")
            continue
        
        # Check pronunciation is not empty
        if not entry['pronunciation'].strip():
            errors.append(f"  {name}: 'pronunciation' cannot be empty")
            continue
        
        # Check for forbidden fields
        if 'link' in entry:
            errors.append(f"  {name}: Manual entries should not have 'link' field (reserved for auto-scraped data)")
        
        # Validate pronunciation format
        format_errors = validate_pronunciation_format(entry['pronunciation'], name)
        warnings.extend(format_errors)
    
    # Report results
    if errors:
        print(f"\n[ERROR] Validation failed with {len(errors)} error(s):\n")
        for error in errors:
            print(error)
        return False
    
    if warnings:
        print(f"\n[WARNING] Validation passed with {len(warnings)} warning(s):\n")
        for warning in warnings:
            print(warning)
        print("\nWarnings do not prevent packaging, but check pronunciation formatting.")
    else:
        print(f"\n[OK] Validation passed: {len(data)} entries validated successfully")
    
    return True

if __name__ == "__main__":
    success = validate_manual_pronunciations()
    sys.exit(0 if success else 1)
