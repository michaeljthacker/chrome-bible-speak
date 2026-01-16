#!/usr/bin/env python3
"""
Organize pronunciation JSON files:
- Alphabetizes entries in names_pronunciations.json and manual_pronunciations.json
- Counts and reports entries in each file
"""

import json
import sys
from pathlib import Path


def organize_json_file(filepath):
    """Alphabetize entries in a JSON file and return entry count."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Sort entries alphabetically by key
        sorted_data = dict(sorted(data.items()))
        
        # Write back to file with proper formatting
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(sorted_data, f, indent=2, ensure_ascii=False)
        
        return len(sorted_data)
    
    except FileNotFoundError:
        print(f"ERROR: File not found: {filepath}", file=sys.stderr)
        return None
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in {filepath}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"ERROR: Failed to process {filepath}: {e}", file=sys.stderr)
        return None


def main():
    # Define file paths
    names_file = Path("names_pronunciations.json")
    manual_file = Path("manual_pronunciations.json")
    
    print("Organizing pronunciation files...")
    
    # Process names_pronunciations.json
    names_count = organize_json_file(names_file)
    if names_count is None:
        return 1
    
    # Process manual_pronunciations.json
    manual_count = organize_json_file(manual_file)
    if manual_count is None:
        return 1
    
    # Calculate total
    total_count = names_count + manual_count
    
    # Output counts (format compatible with build script)
    print(f"BibleSpeak.org: {names_count}; Manual: {manual_count}; Total: {total_count}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
