# Bible Name Aid - Changelog

All notable changes to this project will be documented in this file.

---

## [v1.1.0] - January 12, 2026

### Added
- **Manual Pronunciation Database**: Added `manual_pronunciations.json` with 200+ curated entries for biblical names not available on BibleSpeak.org
- **Alphabetical Name Sorting**: Name lists in popup and selection menu now display in alphabetical order for easier navigation

### Fixed
- **Case-Insensitive Matching**: Fixed regex inconsistency where name detection was case-insensitive but replacement was case-sensitive, causing common nouns like "bitumen" to be missed when not capitalized
- **Possessive Handling**: Updated regex to properly handle possessive forms (e.g., "Matthew's" now renders as "Matthew's (MATH-yoo)" instead of "Matthew (MATH-yoo)'s")
- **Disable All Function**: Fixed critical bug where "Disable All" only removed auto-scraped pronunciations (links) but not manual pronunciations (spans), causing double-pronunciations when re-enabling
- **Name Preservation**: Fixed bug where disabling pronunciations would accidentally remove the name itself from the page instead of just removing the pronunciation aid

### Technical Changes
- Dual-source data architecture: Separate JSON files for auto-scraped vs. manual pronunciations
- Manual pronunciations render as styled `<span>` elements (no links), while auto-scraped pronunciations render as `<a>` links to BibleSpeak.org
- `disableTool()` function now handles both link and span elements when removing pronunciations
- Improved word boundary detection to preserve original text when toggling pronunciations

---

## [v1.0.0] - Initial Release

### Features
- Automatic detection of biblical names on any webpage
- Toast notification when names are found
- Pronunciation aids with clickable links to BibleSpeak.org
- Selection menu for choosing specific names
- Global extension toggle
- Persistent preferences across sessions
- Floating bubble for quick access
- "Enable All", "Disable All", and "Enable Selected" actions
