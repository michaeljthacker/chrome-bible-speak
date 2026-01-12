# Bible Name Aid - Feature Backlog

**Last Updated**: January 12, 2026

This document tracks planned features, enhancements, and known limitations for future development.

---

## High Priority

### Dynamic Content Loading Support (Infinite Scroll)
**Status**: Not Started  
**Priority**: High  
**Discovered**: January 12, 2026

**Problem**:
Some websites (notably esv.org and other Bible sites) use infinite scroll or lazy loading, where content is dynamically added as the user scrolls. Currently, Bible Name Aid only scans and injects pronunciations once when the page first loads, so names in dynamically-loaded content don't get pronunciation aids.

**Impact**:
- Users lose pronunciation support as they scroll through long passages
- Inconsistent experience - names at the top have pronunciations, names at the bottom don't
- Particularly problematic for the extension's primary use case (Bible reading sites)

**Proposed Solutions**:
1. **Mutation Observer**: Watch for DOM changes and re-scan new content as it's added
2. **Manual Refresh Button**: Add a small refresh icon next to the floating bubble that re-scans the current page
3. **Hybrid Approach**: Automatic detection + manual refresh option for fine-grained control

**Technical Considerations**:
- Need to avoid re-processing already-injected names (duplicate pronunciations)
- Performance: Mutation observers can be expensive on high-frequency DOM changes
- UI placement: Refresh button shouldn't clutter the minimal bubble design

**Related Files**:
- `content.js` - Would need mutation observer or refresh function
- CSS styling for refresh button (if applicable)

---

## Medium Priority

### Plural Forms Support
**Status**: Deferred from Phase 1  
**Priority**: Medium  
**Referenced In**: NextSteps.md (Out of Scope)

**Problem**:
Current word boundary detection (`\b${name}\b`) doesn't match plural forms. For example:
- "Pharisee" is detected, but "Pharisees" is not
- "Corinthian" is detected, but "Corinthians" is not

**Impact**:
- Inconsistent pronunciation coverage in passages that use plural forms
- User confusion when some instances of a name are covered and others aren't

**Challenges**:
- **False positives**: Adding fuzzy matching could catch unrelated words
- **Complexity**: Need sophisticated rules for when plurals are appropriate
- **Edge cases**: Not all biblical names simply add "-s" for plurals

**Proposed Approach**:
1. Research: Catalog actual plural patterns in biblical names
2. Build whitelist of approved plural forms to avoid false positives
3. Test extensively against biblical texts before deployment

**Estimated Effort**: Medium (2-3 days design + implementation + testing)

---

### AI-Powered Pronunciation Generation
**Status**: Planned  
**Priority**: Medium  
**Referenced In**: README.md "Future Features", NextSteps.md Phase 4

**Objective**:
Automatically generate BibleSpeak-style pronunciations for rare Old Testament names and terms not available on BibleSpeak.org.

**Approach**:
1. Use OpenAI/Claude API with example-based prompting
2. Feed AI 10-20 existing BibleSpeak pronunciations as style examples
3. Generate phonetic spellings for missing names
4. Validate format (hyphens, CAPS for stress, etc.)
5. Append to `manual_pronunciations.json`

**Current Status**:
- Stub script exists: `scripts/generateManualPronunciations.py`
- Marked "NOT IMPLEMENTED - FUTURE FEATURE"
- Architecture designed but no API integration

**Blockers**:
- Needs API key setup and budget allocation
- Requires validation workflow (human review before adding to database)
- Quality control: AI-generated pronunciations may not match BibleSpeak standards

**Estimated Effort**: Large (1-2 weeks for API integration, testing, validation UI)

---

## Low Priority / Nice-to-Have

### Enhanced Pronunciation Styling
**Status**: Idea  
**Priority**: Low

**Concept**:
- Hover effects on pronunciation text
- Different colors for manual vs. auto-scraped pronunciations
- Tooltip showing source (BibleSpeak.org vs. Manual entry)

**Rationale**:
Visual distinction helps users understand data quality and source authority.

**Concerns**:
- May clutter the minimal design
- Additional CSS complexity for cross-site compatibility

---

### User Customization Options
**Status**: Idea  
**Priority**: Low

**Potential Features**:
- Choose pronunciation style/format (e.g., show pronunciation before name instead of after)
- Font size for pronunciation text
- Color themes for UI elements
- Hide auto-dismiss toast (make it manual-only)

**Trade-off**:
Every option adds complexity and maintenance burden. Current design prioritizes simplicity.

---

## Known Limitations (Not Planned)

### Possessive Edge Cases
**Current Status**: Mostly handled as of Jan 10, 2026  
**Known Issue**: Works for standard `'s` but may not handle archaic possessives like "Jesus'" vs "Jesus's"

**Mitigation**: Regex pattern handles most common cases; edge cases are rare enough not to warrant complex special handling.

---

### Cross-Language Support
**Status**: Out of Scope  
**Reason**: Extension is specifically for English biblical names with English phonetic guides.

---

### Browser Compatibility
**Current**: Chrome/Chromium only  
**Future**: Could adapt for Firefox with minimal changes (Manifest V2/V3 differences)  
**Priority**: Low (Chrome dominates Bible reading site usage)

---

## How to Propose New Features

Email feature requests to [hi@mjt.pub](mailto:hi@mjt.pub) with:

1. Description of the problem/need and proposed solution
2. Examples of where the feature would help
3. Any similar functionality in other extensions

Features will be prioritized based on:
- User impact (how many users benefit?)
- Technical complexity (development time required)
- Maintenance burden (ongoing costs)
- Alignment with core mission (helping pronounce biblical names)
