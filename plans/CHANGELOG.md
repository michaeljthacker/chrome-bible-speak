# Bible Name Aid - Changelog

All notable changes to this project will be documented in this file.

---

## [v1.2.0] - February 2, 2026

### Added
- **Dynamic Content Support**: Extension now automatically detects biblical names in dynamically loaded content (infinite scroll, lazy loading)
  - MutationObserver with 2-second debounce watches for DOM changes
  - Automatically rescans page when new content is added
  - New instances of already-enabled names get pronunciations automatically
  - New names appearing in dynamic content are detected and added to selection menu
  - Works seamlessly with esv.org, biblegateway.com, and other infinite scroll sites
- **Per-Domain Toast Control**: New toggle to disable toast notifications on specific domains while keeping full pronunciation functionality
  - Domain-specific toggle in both popup and selection menu: "at {domain}"
  - Opt-out model: toast enabled by default on all sites
  - Remembers settings per domain across sessions
  - Handles root domain extraction (e.g., `bible.usccb.org` → `usccb.org`)

### Fixed
- **Bubble Flashing**: Fixed issue where floating bubble would flash during automatic content rescans
  - Added `preserveBubble` parameter to `disableTool()` for silent resets
  - `showBubble()` no longer recreates bubble if already visible
- **Extension Context Handling**: Added error handling for extension context invalidation during development (reload scenarios)

### Technical Changes
- **MutationObserver Lifecycle**: Observer starts/stops with extension enable/disable state
- **rescanPage() Function**: Re-scans entire document and updates pronunciations for enabled names
- **Domain Extraction**: New `getRootDomain()` utility function handles www prefix, multi-segment domains, localhost, IPs
- **Storage Schema**: Added `toastDisabledDomains` array to `chrome.storage.local`
- **UI Dependencies**: Domain toggle automatically disables when extension is globally disabled
- **Performance**: 2-second debounce reduces lag on genealogy-heavy passages during fast scrolling

### Files Modified
- `content.js` - MutationObserver, rescanPage, domain extraction, preserveBubble logic
- `popup.js` - Domain toggle initialization and event handling
- `popup.html` - Domain toggle UI element
- `styles.css` - Toggle sizing and spacing adjustments

---

## [v1.1.2] - January 16, 2026

### Added
- **Major Biblical Figures**: Added pronunciations for Paul, Peter, James, Simon, Thomas, and other disciples
- **Abraham's Family**: Added pronunciations for Kemuel, Maacah, Chesed, and other family members
- **Additional Names**: Corinthians (plural), Stephanas, Phicol, Naharaim (as in Aram Naharaim)

### Technical Changes
- **Organization Script**: New `organize_pronunciations.py` script that automatically organizes and deduplicates manual pronunciations
- **Build Statistics**: Enhanced `build_extension.ps1` to log pronunciation database statistics (BibleSpeak.org count, manual count, and total)
- **Integrated Workflow**: Organization script now runs automatically during the build process

---

## [v1.1.1] - January 13, 2026

### Fixed
- **Double/Nested Pronunciation Injection**: Fixed critical bug where pronunciations were injected multiple times or nested within other pronunciations (e.g., "Sheba" within "Beer-sheba", "Ham" within "Abraham")
- **Pronunciation Cleanup**: Improved reliability when disabling pronunciations

### Technical Changes
- Sort names by length before processing to prioritize compound names
- Process all names in single pass per text node with overlap filtering
- Wrap pronunciations in `.bna-pronunciation-marker` spans to prevent re-processing

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
