# Implementation Plan: Manual Pronunciations & Word Detection Fix

**Last Updated**: January 10, 2026  
**Status**: Approved - Ready for Implementation

---

## **Section A: Architecture Design Decisions**

### **A.1 Dual-Source Data Architecture**

**Decision**: Maintain separate JSON files for auto-scraped vs. manually-curated pronunciations.

**Rationale**:
- **Separation of concerns**: Auto-generated data (`names_pronunciations.json`) remains fully managed by the Python scraper without risk of manual entries being overwritten
- **Clear data provenance**: Each entry's source is immediately identifiable by which file it resides in
- **Independent update cycles**: Scraper updates can run on schedule without coordinating with manual curation workflow
- **Simplified tooling**: No need to add metadata flags or complex merge logic within a single file

**File Structure**:
- `names_pronunciations.json` — Existing, auto-scraped from BibleSpeak.org (managed by `scripts/updateWordListJSON.py`)
- `manual_pronunciations.json` — New, hand-curated Old Testament names and other missing entries

**Trade-offs**:
- Pro: Clean separation, no merge conflicts, simpler maintenance
- Con: Two files to load and merge at runtime (minimal performance impact)
- Alternative considered: Single file with `"source": "manual"|"scraped"` flag — rejected due to scraper overwrite risk

---

### **A.2 Link Attribution Standards**

**Decision**: Only include hyperlinks for auto-scraped entries that have a valid BibleSpeak.org source page.

**Rationale**:
- Manual entries have no authoritative online source to link to
- Linking to non-existent pages harms user experience and credibility
- Differentiation in UI: Auto-scraped entries link to BibleSpeak.org; manual entries display pronunciation without link

**Implementation**:
- `names_pronunciations.json` entries: Include `"link"` property (existing behavior)
- `manual_pronunciations.json` entries: Omit `"link"` property
- Content script: Check for presence of `"link"` before rendering hyperlink

---

### **A.3 Data Merge Priority**

**Decision**: BibleSpeak.org data takes precedence over manual entries in case of name collisions.

**Rationale**:
- BibleSpeak.org is the authoritative source with audio pronunciation
- Users benefit from clickable links to hear accurate pronunciation
- Manual entries serve as gap-filler for names not available on BibleSpeak.org
- If a name appears in both files, the BibleSpeak version is preferred

**Implementation**:
```javascript
// BibleSpeak data overrides manual data
const mergedData = { ...manualData, ...autoScrapedData };
```

---

### **A.4 Word Boundary Detection Fixes**

**Decision**: Fix case-sensitivity inconsistency and possessive handling in word detection/replacement logic.

**Root Causes Identified**: 

**Issue 1 - Case Sensitivity**:
- Detection uses case-insensitive regex: `new RegExp(\`\\b${name}\\b\`, 'i')`
- Replacement uses case-sensitive regex: `new RegExp(\`\\b${name}\\b\`, 'g')` (missing 'i' flag!)
- Result: "Bitumen" is detected but "bitumen" replacement fails if cases don't match

**Issue 2 - Possessive Forms**:
- Current regex with `\b` word boundary treats "Matthew's" as "Matthew" + "'s" (separate tokens)
- Result: "Matthew's" becomes awkward "Matthew (MATH-yoo)'s" with possessive separated
- Expected: "Matthew's (MATH-yoo)" keeping possessive attached to the name

**Fix Strategy**:
1. Add 'i' flag to replacement regex for case-insensitive matching
2. Update regex patterns to capture possessive `'s` as part of the name match
3. Place pronunciation after the complete word form (including possessive)

**Benefits**:
- Common nouns (bitumen, apostasy) work regardless of capitalization
- Proper nouns work when capitalized at sentence start
- Possessives render naturally: "Matthew's (MATH-yoo)" not "Matthew (MATH-yoo)'s"
- Consistent behavior between detection and replacement phases

**Out of Scope**: Plural forms (Pharisees, Corinthians) deferred to future "Coverage Expansion" milestone due to complexity of fuzzy matching and false positive risks.

---

### **A.5 Future AI Generation Hook (Deferred)**

**Decision**: Design manual pronunciations file with extensibility for future AI-assisted generation, but do not implement AI integration now.

**Rationale**:
- Current focus: Establish manual curation workflow first
- AI script can be added later as a separate tool that appends to `manual_pronunciations.json`
- AI will be prompted with existing BibleSpeak.org examples to maintain consistent pronunciation style
- Schema should not require changes when AI generation is added

**Preparation**:
- JSON schema identical to auto-scraped format (minus `"link"`)
- Script template stub included in plan for future Staff Engineer implementation

---

## **Section B: Implementation Phases**

### **Phase 1: Fix Word Detection Bugs**

**Objective**: Resolve case-sensitivity bug and possessive formatting issue that affect word detection and replacement.

**Priority**: HIGH - These are current user-facing bugs affecting existing functionality

**Tasks**:

**1.1** Add case-insensitive flag to replacement regex in `enableTool()`  
- Location: [content.js](../content.js) line 586
- Change: `new RegExp(\`\\b${name}\\b\`, 'g')` → `new RegExp(\`\\b${name}\\b\`, 'gi')`
- Validation: Test with "bitumen", "Bitumen", "BITUMEN"

**1.2** Update regex patterns to handle possessive forms  
- Location: [content.js](../content.js) lines 586 and 635 (both detection passes)
- Change word boundary pattern to capture possessive: `\\b${name}\\b` → `\\b${name}('s)?\\b`
- Ensure pronunciation is placed after the complete word including possessive
- Target format: "Matthew's (MATH-yoo)" not "Matthew (MATH-yoo)'s"
- Apply to both initial text replacement and link insertion passes

**1.3** Verify second-pass link insertion handles both fixes  
- Location: [content.js](../content.js) line 635
- Ensure case-insensitive matching with 'gi' flags
- Confirm possessive handling works correctly in link insertion
- The second pass searches for `name('s)? (pronunciation)` pattern

**1.4** Test comprehensive word variations  
- Create test HTML with: proper nouns (Abraham), common nouns (bitumen), mixed case
- Test sentence-start capitalization: "Bitumen was used..." vs "...used bitumen..."
- Test possessive forms: "Matthew's gospel", "Jesus's teachings", "Moses's law"
- Test edge cases: "Matthew's" at sentence start, mid-sentence, end of sentence
- Verify all variations are detected and replaced correctly

**1.5** Document the fixes  
- Add code comments explaining why 'gi' flags are required (case-insensitivity)
- Add comments explaining possessive regex pattern `('s)?`
- Note: Detection (line 47) and replacement (line 586) must stay synchronized

---

### **Phase 2: Establish Manual Pronunciations Infrastructure**

**Objective**: Create the manual pronunciations file and update the content script to load and merge both data sources.

**Tasks**:

**2.1** Create `manual_pronunciations.json` in project root  
- Schema: Same as `names_pronunciations.json` but without `"link"` property
- Initial content: Empty object `{}` or 2-3 example Old Testament names (e.g., Mahershalalhashbaz)
- Validation: JSON must be valid and follow schema

**2.2** Update [content.js](../content.js) to load both data files  
- Modify `loadAndCheckNames()` function to fetch both JSONs in parallel (`Promise.all`)
- Merge with correct precedence: `{ ...manualData, ...autoScrapedData }` (BibleSpeak overrides manual)
- Preserve existing detection logic (lines 46-52)
- Ensure backward compatibility if `manual_pronunciations.json` is missing (graceful fallback)

**2.3** Update [content.js](../content.js) `enableTool()` to conditionally render links  
- Modify pronunciation insertion logic (around line 650)
- Check if `data[name].link` exists before creating hyperlink
- If link exists: Render `<a>` tag with pronunciation (existing behavior)
- If link missing: Render plain italic text `(pronunciation)` without hyperlink
- Maintain consistent styling for both cases

**2.4** Test multi-source loading  
- Verify both files load correctly
- Confirm manual entries appear in detection and selection UI
- Validate links appear only for auto-scraped entries
- Test precedence: Add same name to both files, confirm BibleSpeak version wins

---

### **Phase 3: Documentation & Curation Workflow**

**Objective**: Provide clear instructions for adding manual pronunciations and update project documentation.

**Tasks**:

**3.1** Create `docs/MANUAL_PRONUNCIATIONS.md` documentation file  
- Explain purpose of manual pronunciations (gap-filler for missing BibleSpeak entries)
- Provide step-by-step instructions for adding new entries
- Include example entry with proper JSON formatting
- Clarify why links are omitted (no authoritative source page)
- Note: BibleSpeak.org data takes precedence if name exists in both files
- Document pronunciation style: Follow BibleSpeak.org conventions (e.g., "uh-BIHM-uh-lehk")

**3.2** Update [README.md](../README.md)  
- Add section: "Manual Pronunciations"
- Describe dual-source architecture with BibleSpeak precedence
- Link to `docs/MANUAL_PRONUNCIATIONS.md` for curation guide
- Update "Updating the Pronunciation Database" section to mention both files

**3.3** Add schema validation script (optional but recommended)  
- Simple Node.js or Python script to validate JSON syntax and schema
- Checks:
  - Valid JSON structure
  - Required fields present (`pronunciation`)
  - No `link` field in manual file
  - Pronunciation format consistency
- Can be run manually or as pre-commit hook

---

### **Phase 4: Prepare for Future AI Generation (Stub Only)**

**Objective**: Create placeholder for future AI-assisted pronunciation generation tool.

**Tasks**:

**4.1** Create `scripts/generateManualPronunciations.py` stub script  
- File location: scripts/ folder
- Stub content:
  - Script header with description
  - Environment variable placeholders for API keys (`OPENAI_API_KEY`, etc.)
  - Function signatures for:
    - `get_ai_pronunciation(name: str, examples: List[dict]) -> str`
    - `append_to_manual_file(name: str, pronunciation: str)`
  - Comment blocks explaining future implementation approach:
    - Pull 10-20 examples from existing BibleSpeak data
    - Prompt AI: "Given these pronunciation examples, generate similar pronunciation for: {word}"
    - Maintain consistent style with existing pronunciations
  - Mark as "NOT IMPLEMENTED - FUTURE FEATURE"

**4.2** Update `.gitignore` for API keys  
- Add entry for `.env` file (if not already present)
- Ensure API keys never committed to repository

**4.3** Document AI generation plan in [README.md](../README.md)  
- Add "Future Features" section
- Describe AI pronunciation generation concept with example-based prompting
- Note current status: "Planned, not yet implemented"

---

## **Section C: Implementation Details**

### **C.1 File Schema Specifications**

#### **`manual_pronunciations.json`**

```json
{
  "Mahershalalhashbaz": {
    "pronunciation": "MAY-hur-SHAL-al-HASH-baz"
  },
  "Chedorlaomer": {
    "pronunciation": "ked-or-lay-OH-mer"
  }
}
```

**Schema**:
- Keys: Biblical name (string, exact case-sensitive match for detection)
- Values: Object with required `"pronunciation"` property (string)
- No `"link"` property

#### **Merged Data Structure (Runtime)**

When both files are loaded, content script merges them with BibleSpeak precedence:

```javascript
// BibleSpeak data overrides manual data
const mergedData = { ...manualData, ...autoScrapedData };
```

**Merge Behavior Example**:
```javascript
// If "Abraham" exists in both files:
// manual_pronunciations.json: "Abraham": { "pronunciation": "AY-bruh-ham" }
// names_pronunciations.json: "Abraham": { "pronunciation": "AY-bruh-ham", "link": "..." }
// Result: BibleSpeak version used (includes link)
```

---

### **C.2 Bug Fixes: Case-Insensitivity and Possessive Handling**

#### **Fix 1: Case-Insensitive Regex (Phase 1, Task 1.1)**

**Location**: [content.js](../content.js) line 586

**Before**:
```javascript
newNames.forEach(name => {
  const regex = new RegExp(`\\b${name}\\b`, 'g');
  if (regex.test(text)) {
```

**After**:
```javascript
newNames.forEach(name => {
  // Use 'gi' flags to match case-insensitively (consistent with detection phase at line 47)
  const regex = new RegExp(`\\b${name}\\b`, 'gi');
  if (regex.test(text)) {
```

---

#### **Fix 2: Possessive Form Handling (Phase 1, Task 1.2)**

**Location**: [content.js](../content.js) lines 586 (first pass) and 635 (second pass)

**Problem**: Current pattern splits possessives awkwardly
- Input: "Matthew's gospel"
- Current output: "Matthew (MATH-yoo)'s gospel" ❌
- Desired output: "Matthew's (MATH-yoo) gospel" ✅

**Solution**: Capture optional possessive `'s` as part of the name match

**First Pass - Before**:
```javascript
newNames.forEach(name => {
  const regex = new RegExp(`\\b${name}\\b`, 'gi');
  if (regex.test(text)) {
    const info = nameMap[name];
    const replacement = `${name} (${info.pronunciation})`;
    text = text.replace(regex, replacement);
```

**First Pass - After**:
```javascript
newNames.forEach(name => {
  // Capture possessive 's as part of the match for natural rendering
  const regex = new RegExp(`\\b${name}('s)?\\b`, 'gi');
  if (regex.test(text)) {
    const info = nameMap[name];
    // Use $0 to preserve the matched form (with or without 's)
    const replacement = `$0 (${info.pronunciation})`;
    text = text.replace(regex, replacement);
```

**Second Pass - Before**:
```javascript
const regex = new RegExp(`\\b${name} \\(${info.pronunciation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
```

**Second Pass - After**:
```javascript
// Match name with optional possessive followed by pronunciation
const escapedPronun = info.pronunciation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(`\\b${name}('s)? \\(${escapedPronun}\\)`, 'gi');
```

**Key Changes**:
1. Add `('s)?` to capture optional possessive marker
2. Use `$0` in replacement to preserve exact matched form (case and possessive)
3. Add 'gi' flags for case-insensitive matching
4. Apply to both first pass (text replacement) and second pass (link insertion)

**Test Cases**:
- "Matthew's" → "Matthew's (MATH-yoo)"
- "Jesus's" → "Jesus's (JEE-zuhs)"
- "Moses's" → "Moses's (MOH-zehz)"
- "matthew's" → "matthew's (MATH-yoo)" (lowercase preserved)
- "MATTHEW'S" → "MATTHEW'S (MATH-yoo)" (uppercase preserved)

---

### **C.3 Content Script Loading Logic**

**Update `loadAndCheckNames()` function** (Phase 2, Task 2.2):

```javascript
async function loadAndCheckNames() {
  try {
    const [autoData, manualData] = await Promise.all([
      fetch(chrome.runtime.getURL('names_pronunciations.json')).then(r => r.json()),
      fetch(chrome.runtime.getURL('manual_pronunciations.json'))
        .then(r => r.json())
        .catch(() => {
          console.log('No manual pronunciations file found, using auto-scraped data only');
          return {}; // Graceful fallback
        })
    ]);
    
    // BibleSpeak data takes precedence over manual entries
    jsonData = { ...manualData, ...autoData };
    
    console.log(`Loaded ${Object.keys(autoData).length} auto-scraped + ${Object.keys(manualData).length} manual pronunciations`);
    
    // Continue with existing detection logic...
    if (!document.body) {
      console.log('No document.body found, skipping extension functionality');
      return;
    }
    
    const names = Object.keys(jsonData);
    const bodyText = document.body.innerText;
    // ... rest of function unchanged
  } catch (error) {
    console.error('Error loading pronunciation data:', error);
  }
}
```

---

### **C.4 Conditional Link Rendering**

**Update `enableTool()` link creation** (Phase 2, Task 2.3, around line 650):

```javascript
nodesToReplace.forEach(node => {
  const text = node.textContent;
  const parts = text.split(regex);
  const matches = text.match(regex) || [];
  
  if (matches.length > 0) {
    const fragment = document.createDocumentFragment();
    
    parts.forEach((part, index) => {
      if (part) {
        fragment.appendChild(document.createTextNode(part));
      }
      if (index < matches.length) {
        const wrapper = document.createDocumentFragment();
        wrapper.appendChild(document.createTextNode(`${name} (`));
        
        // Conditional link rendering based on data source
        if (info.link) {
          // Auto-scraped from BibleSpeak: create hyperlink
          const link = document.createElement('a');
          link.href = info.link;
          link.target = '_blank';
          link.style.cssText = 'color: #4285f4 !important; text-decoration: none !important; font-style: italic !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important;';
          link.textContent = info.pronunciation;
          wrapper.appendChild(link);
        } else {
          // Manual entry: plain italic text (no link)
          const span = document.createElement('span');
          span.style.cssText = 'color: #666 !important; font-style: italic !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important;';
          span.textContent = info.pronunciation;
          wrapper.appendChild(span);
        }
        
        wrapper.appendChild(document.createTextNode(')'));
        fragment.appendChild(wrapper);
      }
    });
    
    node.parentNode.replaceChild(fragment, node);
  }
});
```

---

### **C.5 AI Generation Script Stub**

**`scripts/generateManualPronunciations.py`** (Phase 4, Task 4.1):

```python
#!/usr/bin/env python3
"""
AI-Assisted Pronunciation Generator for Manual Pronunciations
Status: NOT IMPLEMENTED - Placeholder for future development

This script will use OpenAI API (or similar) to generate phonetic 
pronunciations for biblical names not found in BibleSpeak.org.

Approach:
1. Load existing BibleSpeak pronunciations as examples
2. Select 10-20 representative examples (various lengths, patterns)
3. Prompt AI with examples: "Given these pronunciation examples, 
   generate a similar phonetic pronunciation for: {word}"
4. Validate output format matches BibleSpeak style
5. Append to manual_pronunciations.json

Usage (future):
  python scripts/generateManualPronunciations.py --name "Mahershalalhashbaz"
  python scripts/generateManualPronunciations.py --batch names_to_add.txt
  
Environment Variables Required:
  OPENAI_API_KEY - API key for OpenAI service (or similar provider)
"""

import os
import json
from typing import List, Optional, Dict

MANUAL_FILE = "manual_pronunciations.json"
AUTO_FILE = "names_pronunciations.json"

def load_example_pronunciations(count: int = 15) -> List[Dict[str, str]]:
    """
    Load sample pronunciations from BibleSpeak data to use as examples.
    
    Args:
        count: Number of examples to load
        
    Returns:
        List of dictionaries with 'name' and 'pronunciation' keys
        
    TODO: Implement - select diverse examples (short/long names, etc.)
    """
    raise NotImplementedError("Example loading not yet implemented")

def get_ai_pronunciation(name: str, examples: List[Dict[str, str]]) -> Optional[str]:
    """
    Query AI API for pronunciation of a biblical name using example-based prompting.
    
    Args:
        name: Biblical name to get pronunciation for
        examples: List of existing pronunciation examples to guide AI
        
    Returns:
        Phonetic pronunciation string matching BibleSpeak style, or None if unavailable
        
    Example Prompt:
        "Here are pronunciation examples for biblical names:
        - Abraham: AY-bruh-ham
        - Nebuchadnezzar: neb-uh-kuhd-NEZ-er
        - Isaiah: ai-ZAY-uh
        ...
        
        Generate a similar phonetic pronunciation for: {name}"
        
    TODO: Implement API call to OpenAI/Claude/etc.
    """
    raise NotImplementedError("AI generation not yet implemented")

def append_to_manual_file(name: str, pronunciation: str):
    """
    Add new entry to manual_pronunciations.json.
    
    Args:
        name: Biblical name
        pronunciation: Phonetic pronunciation string
        
    TODO: Implement with proper JSON formatting and duplicate checking
    """
    raise NotImplementedError("Manual file update not yet implemented")

def validate_pronunciation_format(pronunciation: str) -> bool:
    """
    Validate that pronunciation follows BibleSpeak conventions.
    
    Args:
        pronunciation: Generated pronunciation string
        
    Returns:
        True if format is valid
        
    TODO: Implement format validation (hyphens, capitalization, etc.)
    """
    raise NotImplementedError("Validation not yet implemented")

if __name__ == "__main__":
    print("=" * 60)
    print("ERROR: This script is not yet implemented.")
    print("=" * 60)
    print("\nPlanned functionality:")
    print("- Load BibleSpeak pronunciation examples")
    print("- Use AI with example-based prompting to generate new pronunciations")
    print("- Validate output format")
    print("- Append to manual_pronunciations.json")
    print("\nSee docstring for detailed implementation plan.")
    print("=" * 60)
    exit(1)
```

---

## **Section D: Acceptance Criteria**

### **Phase 1 Success Criteria (Bug Fixes)**

**Case-Sensitivity Fix**:
✅ **AC-1.1**: Regex in `enableTool()` updated to include 'gi' flags  
✅ **AC-1.2**: Test "bitumen" detected and replaced regardless of capitalization  
✅ **AC-1.3**: Test "Bitumen" at sentence start is detected and replaced  
✅ **AC-1.4**: Test existing proper nouns (e.g., "Abraham") still work correctly  

**Possessive Handling Fix**:
✅ **AC-1.5**: Possessive forms captured in regex pattern using `('s)?`  
✅ **AC-1.6**: "Matthew's" renders as "Matthew's (MATH-yoo)" not "Matthew (MATH-yoo)'s"  
✅ **AC-1.7**: Test "Jesus's", "Moses's", and other possessive variations  
✅ **AC-1.8**: Possessive handling works at sentence start, middle, and end  
✅ **AC-1.9**: Link insertion (second pass) also handles possessives correctly  

**General**:
✅ **AC-1.10**: No regression in existing functionality  
✅ **AC-1.11**: Code comments added explaining case-insensitive requirement and possessive pattern  

**Validation Method**: Create test HTML with mixed-case words and possessive forms; verify all variations render naturally; test "Matthew's", "Jesus's", "Moses's" in various contexts; inspect console for errors

---

### **Phase 2 Success Criteria (Manual Pronunciations)**

✅ **AC-2.1**: `manual_pronunciations.json` exists in project root with valid JSON structure  
✅ **AC-2.2**: [content.js](../content.js) successfully loads both JSON files without errors  
✅ **AC-2.3**: Extension detects names from both auto-scraped and manual sources  
✅ **AC-2.4**: Selection UI displays names from both sources correctly  
✅ **AC-2.5**: Auto-scraped names render with hyperlinks to BibleSpeak.org  
✅ **AC-2.6**: Manual names render pronunciations without hyperlinks (plain italic text)  
✅ **AC-2.7**: No console errors when `manual_pronunciations.json` is missing (graceful degradation)  
✅ **AC-2.8**: When name exists in both files, BibleSpeak version is used (with link)  

**Validation Method**: Manual testing with sample manual entries; test name collision scenario; inspect rendered HTML to confirm link presence/absence and correct precedence

---

### **Phase 3 Success Criteria (Documentation)**

✅ **AC-3.1**: `docs/MANUAL_PRONUNCIATIONS.md` file created with complete curation instructions  
✅ **AC-3.2**: Documentation explains BibleSpeak precedence policy  
✅ **AC-3.3**: [README.md](../README.md) updated to reference dual-source architecture  
✅ **AC-3.4**: JSON validation script created (if implemented) and runs without errors  
✅ **AC-3.5**: Documentation includes example manual entry with correct formatting  
✅ **AC-3.6**: Pronunciation style guidelines documented (follow BibleSpeak conventions)  
✅ **AC-3.7**: Non-technical users can follow instructions to add manual entries  

**Validation Method**: Ask non-engineer team member to add a manual entry following documentation; verify success

---

### **Phase 4 Success Criteria (AI Stub)**

✅ **AC-4.1**: `scripts/generateManualPronunciations.py` stub file created in scripts/ folder  
✅ **AC-4.2**: Stub includes complete function signatures and docstrings  
✅ **AC-4.3**: Stub documents example-based prompting approach  
✅ **AC-4.4**: `.gitignore` updated to exclude `.env` files  
✅ **AC-4.5**: [README.md](../README.md) "Future Features" section added  
✅ **AC-4.6**: Stub script exits gracefully with clear "not implemented" message  

**Validation Method**: Run stub script; confirm it exits with informative error; verify `.env` not tracked by Git

---

## **Risk Assessment & Mitigation**

### **🟢 Low Risk (Resolved)**

**R1**: Case-sensitivity bug root cause unclear  
- **Status**: RESOLVED  
- **Finding**: Detection uses case-insensitive regex ('i' flag), replacement uses case-sensitive regex (missing 'i' flag)
- **Solution**: Add 'gi' flags to replacement regex in Phase 1
- **Impact**: Simple one-line code change

**R2**: Pronunciation style consistency  
- **Status**: ADDRESSED  
- **Solution**: PM will use AI with BibleSpeak examples to maintain consistent style
- **Documentation**: Guidelines added to Phase 3 deliverables

### **⚠️ Medium Risk**

**R3**: Name collision handling between files  
- **Status**: CLARIFIED  
- **Decision**: BibleSpeak data overrides manual entries (PM preference)
- **Rationale**: BibleSpeak has audio links and is authoritative source
- **Mitigation**: Document merge behavior clearly in `docs/MANUAL_PRONUNCIATIONS.md`

**R4**: Second-pass regex may need case-insensitivity and possessive handling  
- **Status**: TO BE VERIFIED in Phase 1, Task 1.3  
- **Location**: Line 635 in content.js  
- **Risk**: If first pass creates "Name('s)? (...)" but second pass searches for exact case match or doesn't handle possessives, link insertion may fail
- **Mitigation**: Review and add 'gi' flags plus `('s)?` pattern during Phase 1 implementation

**R5**: Plural forms deferred but may cause user confusion  
- **Status**: ACCEPTED - Out of scope for this milestone  
- **Examples**: "Pharisees", "Corinthians", "Philippians" won't get pronunciations
- **Reason**: Fuzzy matching complexity and false positive risks (e.g., "Peter" matching "Peters" surname)
- **Mitigation**: Document in README as known limitation; track as separate future enhancement
- **Future Solution**: Explicit plural mapping in JSON or fuzzy matching with confidence threshold

### **✅ Out of Scope (Per PM)**

- "Suggest a word" feature with backend (deferred to future milestone)

---

## **Estimated Effort (Staff Engineer Hours)**

- **Phase 1**: 3-4 hours (case-sensitivity fix + possessive handling + comprehensive testing)
- **Phase 2**: 4-6 hours (file creation, dual-loading logic, conditional rendering)
- **Phase 3**: 2-3 hours (documentation writing)
- **Phase 4**: 1-2 hours (stub creation only)

**Total**: ~10-15 hours for complete milestone

---

## **Dependencies & Sequencing**

**Recommended Sequence**: Phase 1 → Phase 2 → Phase 3 → Phase 4

**Rationale**:
- **Phase 1 first**: Bug fix is user-facing and affects existing functionality; should be deployed ASAP
- **Phase 2 depends on Phase 1**: Manual pronunciations benefit from working word detection
- **Phase 3 runs parallel**: Documentation can be written during or after Phase 2 implementation
- **Phase 4 independent**: Stub creation can happen anytime; no dependencies

**Early Deployment Option**:
Phase 1 can be deployed independently before Phases 2-4 are complete, providing immediate bug fix to users.

---

## **Implementation Checklist**

### Pre-Implementation
- [ ] Review plan with Staff Engineers for technical feasibility
- [ ] Confirm pronunciation style guidelines (use BibleSpeak conventions)
- [ ] Set up test environment with sample HTML containing mixed-case words

### Phase 1: Bug Fixes
- [ ] Task 1.1: Add 'gi' flags to line 586 regex (case-insensitivity)
- [ ] Task 1.2: Update regex to capture possessives with `('s)?` pattern
- [ ] Task 1.3: Review line 635 regex for case-sensitivity and possessive handling
- [ ] Task 1.4: Test with bitumen, Bitumen, BITUMEN, Abraham
- [ ] Task 1.5: Test with Matthew's, Jesus's, Moses's (possessives)
- [ ] Task 1.6: Add explanatory code comments for both fixes
- [ ] Deploy bug fixes (can ship before other phases)

### Phase 2: Manual Pronunciations
- [ ] Task 2.1: Create `manual_pronunciations.json` with 2-3 examples
- [ ] Task 2.2: Update `loadAndCheckNames()` for dual-source loading
- [ ] Task 2.3: Implement conditional link rendering in `enableTool()`
- [ ] Task 2.4: Test multi-source with name collision scenarios

### Phase 3: Documentation
- [ ] Task 3.1: Write `docs/MANUAL_PRONUNCIATIONS.md`
- [ ] Task 3.2: Update README.md
- [ ] Task 3.3: Create JSON validation script (optional)
- [ ] User acceptance test: Non-engineer adds manual entry

### Phase 4: AI Stub
- [ ] Task 4.1: Create `scripts/generateManualPronunciations.py` stub
- [ ] Task 4.2: Update `.gitignore` for `.env`
- [ ] Task 4.3: Add Future Features section to README

### Post-Implementation
- [ ] Code review
- [ ] QA testing across different websites
- [ ] Update Chrome Web Store listing (if needed)
- [ ] Tag release version

---

**Status**: Ready for Staff Engineer implementation  
**Next Action**: Begin Phase 1 (Bug Fix) implementation
