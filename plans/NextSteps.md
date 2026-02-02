# NextSteps

**Status**: IN PROGRESS  
**Branch**: `feat/refresh-and-domains`  
**Last Updated**: February 2, 2026

This document contains the implementation plan for the next milestone: Dynamic Content Support & Per-Domain Toast Control.

---

## Section A: Architecture Design Decisions

### A.1 Dynamic Content Loading Support (Feature 1)

#### A.1.1 Problem Analysis
The content script runs `loadAndCheckNames()` once at page load. Infinite scroll sites (esv.org, etc.) append new DOM content after load, which never gets scanned.

#### A.1.2 Chosen Approach: Hybrid (MutationObserver + Manual Refresh)

**Decision**: Implement both automatic detection via MutationObserver AND a manual refresh button on the floating bubble.

**Rationale**:
- **MutationObserver** handles the common case (infinite scroll) automatically
- **Manual refresh** provides user control for edge cases the observer might miss or when users want explicit re-scanning
- Both are low-cost to implement given the existing architecture

**Trade-offs Considered**:

| Approach | Pros | Cons |
|----------|------|------|
| MutationObserver Only | Fully automatic | Risk of performance issues; user has no manual control |
| Manual Refresh Only | Simple; user-controlled | Poor UX for infinite scroll (user must click repeatedly) |
| **Hybrid (Chosen)** | Best of both; graceful degradation | Slightly more implementation effort |

#### A.1.3 MutationObserver Design

**Throttling Strategy**: Use a **debounced callback** (300-500ms delay after last mutation) rather than immediate processing. This batches rapid DOM changes (common during scroll loading) into single re-scans.

**Scope**: Observe `document.body` with `{ childList: true, subtree: true }` to catch deeply nested content additions.

**Duplicate Prevention**: The existing `bna-pronunciation-marker` class provides a reliable marker. The `traverseDOM()` function already skips nodes with this class. We leverage this without changes.

**When to Activate**: Only start observing AFTER `enableTool()` is first called (i.e., after user enables pronunciations). No need to watch DOM before pronunciations are active.

#### A.1.4 Refresh Button Design

**Placement**: Add a small refresh icon to the floating bubble (the `#chrome-bible-speak-bubble` element that appears after pronunciations are enabled).

**Behavior**: On click:
1. Re-scan the page for `foundNames` (in case new names appeared)
2. Re-run `enableTool()` for currently-enabled names only
3. Show brief visual feedback (icon spin animation)

**Why not popup.html?** The refresh action is contextual to the current page state. The bubble is always visible when pronunciations are enabled, making it the natural home. The popup is for initial configuration, not ongoing interaction.

---

### A.2 Per-Domain Pop-up Toast Control (Feature 2)

#### A.2.1 Problem Analysis
The toast appears on every page where names are found, even on sites where pronunciation aid is unwanted. Users need granular control without fully disabling the extension.

#### A.2.2 Chosen Approach: Domain-Disable List with Minimal UI

**Decision**: Store only disabled domains (opt-out model). Add one toggle to popup.html below the global toggle.

**Rationale**:
- Storing only disabled domains keeps storage minimal (most users will disable just a few sites)
- Opt-out model means zero configuration needed for new users
- Single toggle with dynamic label (`at {domain}`) maintains minimal UI philosophy

#### A.2.3 Domain Extraction

**Algorithm**: Extract registrable domain (root domain) from `window.location.hostname`:
1. Strip `www.` prefix if present
2. Use the effective second-level domain approach

**Examples**:
- `www.example.com` → `example.com`
- `blog.example.com` → `example.com`
- `bible.usccb.org` → `usccb.org`

**Implementation**: Use a simple heuristic (last two segments) for common TLDs. This won't handle complex TLDs like `.co.uk` perfectly—acceptable for v1; iterate if user feedback indicates issues.

#### A.2.4 Storage Schema

```javascript
// chrome.storage.local structure
{
  extensionEnabled: true,           // existing global toggle
  toastDisabledDomains: ["facebook.com", "google.com"]  // NEW: domains where toast is suppressed
}
```

**Why local storage?** Toast preferences are device-specific. Sync not required.

#### A.2.5 Toast Suppression Logic

When toast would normally show in `content.js`:
1. Get `toastDisabledDomains` from storage
2. Extract current page's root domain
3. If domain is in disabled list, skip `showToast()` but still populate `foundNames`

**Key Insight**: Only the toast is suppressed. The bubble and full pronunciation functionality remain available via the popup. When `rescanPage()` finds new names, they are added to `foundNames` and appear in the popup/menu—but no toast is re-shown.

---

### A.3 Cross-Feature Considerations

#### A.3.1 Feature Independence
These features are independent and can be implemented in parallel or sequentially without dependencies.

#### A.3.2 Minimal Manifest Changes
No new permissions required. `storage` permission already exists. No changes to `manifest.json`.

#### A.3.3 Testing Strategy
Both features require testing on real infinite-scroll sites (esv.org) and multi-domain scenarios. Add test cases to `docs/release-smoke-test.html`.

---

## Section B: Implementation Phases

### Phase 1: Per-Domain Toast Control
**Rationale**: Lower complexity; delivers immediate user value; no risk of performance regressions.

#### Task 1.1: Create Domain Extraction Utility
- **File**: `content.js`
- **Task**: Add function `getRootDomain(hostname)` that extracts the registrable domain
- **Spec**: Handle `www.` prefix, extract last two segments (e.g., `bible.usccb.org` → `usccb.org`)

#### Task 1.2: Add Storage Check in Toast Logic
- **File**: `content.js`
- **Task**: Modify the section before `showToast()` (around line 64) to check `toastDisabledDomains`
- **Spec**: 
  - Retrieve `toastDisabledDomains` from `chrome.storage.local`
  - If current domain is in list, skip `showToast()` call
  - Still populate `foundNames` and `jsonData` for popup/bubble functionality

#### Task 1.3: Add Domain Toggle to Popup UI
- **File**: `popup.html`
- **Task**: Add a second toggle below the "Extension Enabled" toggle
- **Spec**: 
  - Label: `Pop-up at {domain}` (dynamically populated)
  - Same styling as existing toggle
  - Place within `.cbs-popup-toggle-container` structure

#### Task 1.4: Implement Domain Toggle Logic in Popup
- **File**: `popup.js`
- **Task**: Add handler for domain toggle that updates `toastDisabledDomains`
- **Spec**:
  - On popup load, determine current tab's root domain
  - Check if domain is in `toastDisabledDomains`; set toggle state accordingly
  - On toggle change: add/remove domain from array and persist to storage
  - Handle edge case: popup opened on chrome:// or extension pages (hide toggle or disable)

#### Task 1.5: Add Messaging to Content Script (Optional Enhancement)
- **File**: `content.js`
- **Task**: Add message listener for `toastSettingChanged` to immediately hide toast if user disables via popup while toast is visible
- **Spec**: If toast is currently shown and user disables domain, call `hideToast()`

---

### Phase 2: Dynamic Content Loading Support

#### Task 2.1: Add Refresh Button to Floating Bubble
- **File**: `content.js`
- **Task**: Modify `showBubble()` function to include a refresh icon alongside the existing icon
- **Spec**:
  - Small refresh icon (SVG) positioned at top-right corner of bubble or as second element
  - Click handler calls new `rescanPage()` function
  - Visual feedback: brief rotation animation on click

#### Task 2.2: Implement `rescanPage()` Function
- **File**: `content.js`
- **Task**: Create function that re-scans page and re-applies pronunciations
- **Spec**:
  - Re-scan `document.body.innerText` for all names in `jsonData`
  - Update `foundNames` array with any newly discovered names
  - Call `enableTool(jsonData, enabledNames)` (already handles duplicates via `bna-pronunciation-marker` detection)
  - New names appear in popup/menu when user opens it (no toast re-shown)

#### Task 2.3: Implement MutationObserver Infrastructure
- **File**: `content.js`
- **Task**: Add MutationObserver that watches for DOM additions
- **Spec**:
  - Create observer variable at module scope
  - Observer callback: debounce with 400ms delay, then call `rescanPage()`
  - Only observe changes within `document.body`, not our own UI elements

#### Task 2.4: Activate Observer on First Enable
- **File**: `content.js`
- **Task**: Start observer when pronunciations are first enabled
- **Spec**:
  - In `enableTool()`, after enabling names, call `startObserver()` if not already running
  - In `disableTool()` (when all names disabled), call `stopObserver()`
  - Track observer state with boolean flag

#### Task 2.5: Add Observer Configuration Options (Future-Proofing)
- **File**: `content.js`
- **Task**: Make debounce delay configurable at top of file
- **Spec**: `const MUTATION_DEBOUNCE_MS = 400;` - allows easy tuning if performance issues arise

---

### Phase 3: Testing & Polish

#### Task 3.1: Update Smoke Test Document
- **File**: `docs/release-smoke-test.html`
- **Task**: Add test cases for:
  - Domain toggle persistence across popup opens
  - Toast suppression on disabled domains
  - Refresh button functionality
  - MutationObserver on simulated infinite scroll

#### Task 3.2: Test on Real Infinite Scroll Sites
- **Task**: Manual testing on esv.org, biblegateway.com, and other Bible reading sites with lazy loading
- **Spec**: Verify pronunciations appear on dynamically loaded content within 1 second of it appearing

#### Task 3.3: Update Documentation
- **File**: `README.md` - Document new features in user-facing documentation
- **File**: `plans/backlog.md` - Move features from "Not Started" to "Completed" with implementation date

---

## Section C: Implementation Details

### C.1 Domain Extraction Utility

```javascript
/**
 * Extracts the root domain from a hostname.
 * Examples:
 *   "www.example.com" → "example.com"
 *   "bible.usccb.org" → "usccb.org"
 *   "biblegateway.com" → "biblegateway.com"
 * 
 * @param {string} hostname - The hostname (e.g., window.location.hostname)
 * @returns {string} The root domain
 */
function getRootDomain(hostname) {
  // Remove www. prefix if present
  let domain = hostname.replace(/^www\./, '');
  
  // Split by dots and take last two segments
  const parts = domain.split('.');
  if (parts.length > 2) {
    domain = parts.slice(-2).join('.');
  }
  
  return domain;
}
```

**Known Limitation**: This simple approach doesn't handle multi-part TLDs like `.co.uk` or `.com.au`. For v1, this is acceptable; users on such domains will see the full subdomain in the toggle label.

### C.2 Storage Key Name
- **Key**: `toastDisabledDomains`
- **Type**: `string[]`
- **Default**: `[]` (empty array, all domains enabled)

### C.3 Popup HTML Addition (Insert after existing toggle container)

```html
<div class="cbs-popup-toggle-container" id="cbs-domain-toggle-container" style="margin-top: 8px;">
  <span class="cbs-popup-toggle-label" id="cbs-domain-toggle-label">Pop-up at domain</span>
  <label class="cbs-toggle-switch">
    <input type="checkbox" id="cbs-popup-domain-toggle" checked>
    <span class="cbs-toggle-slider"></span>
    <span class="cbs-toggle-knob"></span>
  </label>
</div>
```

### C.4 MutationObserver Configuration

```javascript
// Module-level variables
let mutationObserver = null;
let mutationDebounceTimer = null;
const MUTATION_DEBOUNCE_MS = 400;

function startObserver() {
  if (mutationObserver) return; // Already running
  
  mutationObserver = new MutationObserver((mutations) => {
    // Debounce: reset timer on each mutation batch
    clearTimeout(mutationDebounceTimer);
    mutationDebounceTimer = setTimeout(() => {
      rescanPage();
    }, MUTATION_DEBOUNCE_MS);
  });
  
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function stopObserver() {
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  clearTimeout(mutationDebounceTimer);
}
```

### C.5 Refresh Button SVG Icon

```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
  <polyline points="23 4 23 10 17 10"></polyline>
  <polyline points="1 20 1 14 7 14"></polyline>
  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
</svg>
```

### C.6 File Changes Summary

| File | Phase | Changes |
|------|-------|---------|
| `content.js` | 1, 2 | `getRootDomain()`, toast suppression logic, `rescanPage()`, MutationObserver, bubble refresh button |
| `popup.html` | 1 | Domain toggle HTML element |
| `popup.js` | 1 | Domain toggle logic, storage read/write |
| `background.js` | - | No changes needed |
| `manifest.json` | - | No changes needed |
| `styles.css` | 2 | Refresh icon animation (optional) |

---

## Section D: Acceptance Criteria

### D.1 Per-Domain Toast Control (Phase 1)

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| 1.1 | Popup shows domain toggle with correct label (e.g., "Pop-up at usccb.org") | Open popup on various sites; verify label matches root domain |
| 1.2 | Domain toggle defaults to ON (checked) for new domains | Visit a never-visited site; verify toggle is checked |
| 1.3 | Toggling OFF adds domain to `toastDisabledDomains` in storage | Use Chrome DevTools to inspect `chrome.storage.local` |
| 1.4 | Toggling ON removes domain from `toastDisabledDomains` | Verify storage after toggling back on |
| 1.5 | Toast does NOT appear on page load for disabled domains | Reload page after disabling; toast should not show |
| 1.6 | Pronunciations still work (via popup or bubble) on disabled domains | On disabled domain, open popup and enable pronunciations |
| 1.7 | Domain toggle hidden/disabled on non-web pages (chrome://, about:) | Open popup on chrome://extensions; toggle should not appear |
| 1.8 | Storage persists across browser restarts | Disable domain, close browser, reopen, verify still disabled |

### D.2 Dynamic Content Loading Support (Phase 2)

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| 2.1 | Refresh icon appears on floating bubble when pronunciations are enabled | Enable pronunciations; verify refresh icon visible on bubble |
| 2.2 | Clicking refresh re-scans page and adds pronunciations to new content | Simulate infinite scroll (or use esv.org); click refresh; verify new names get pronunciations |
| 2.3 | Refresh does not duplicate already-injected pronunciations | Click refresh multiple times; verify no double pronunciations |
| 2.4 | MutationObserver auto-detects new content on infinite scroll sites | On esv.org, enable pronunciations, scroll to load new content; pronunciations should appear automatically within ~500ms |
| 2.5 | MutationObserver does NOT fire excessively | Use console.log in observer callback; scroll rapidly; verify debouncing limits callback frequency |
| 2.6 | Observer starts only after first `enableTool()` call | On fresh page load (no pronunciations enabled), verify no observer is active |
| 2.7 | Observer stops when all pronunciations are disabled | Disable all; verify observer is disconnected |
| 2.8 | Refresh button has visual feedback (spin animation) | Click refresh; verify icon animates briefly |
| 2.9 | New names from rescan appear in popup/menu | After rescan finds new names, open popup; verify new names listed |

### D.3 General Quality

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| 3.1 | No console errors in DevTools | Test all features; monitor console |
| 3.2 | No performance degradation on normal pages | Compare page load times before/after on static pages |
| 3.3 | All existing functionality continues to work | Run full smoke test from `docs/release-smoke-test.html` |

---

## Decisions Log

### Phase 2 Implementation Notes (February 2, 2026)

**Approved by Product Owner**: Michael (Human Product Owner)

#### Decision 1: Remove Refresh Button from Bubble
**Context**: Initial Phase 2 implementation included a refresh button overlay on the floating bubble icon.

**Problem**: The button added visual clutter to an otherwise clean icon. Testing showed MutationObserver handles dynamic content effectively, making manual refresh largely redundant.

**Decision**: Remove refresh button entirely. Users can still manually rescan if needed by opening the selection menu and clicking "Enable Selected" (which rescans the page with current selections).

**Rationale**:
- MutationObserver with 2-second debounce handles 99% of use cases automatically
- Manual refresh via selection menu provides fallback for edge cases
- Cleaner UI > redundant manual control
- Product Owner approved: "it just looks way more clunky to me, personally"

#### Decision 2: Increase MutationObserver Debounce to 2 Seconds
**Context**: Initial implementation used 400ms debounce delay.

**Problem**: On genealogy-heavy Bible passages (Genesis, Chronicles), rapid scrolling triggers hundreds of name injections, causing noticeable lag every 400ms.

**Decision**: Increase `MUTATION_DEBOUNCE_MS` from 400ms to 2000ms (2 seconds).

**Rationale**:
- People read slower than AI - 2 second delay is imperceptible to readers
- Batches multiple mutations during fast scrolling, reducing CPU load
- Still feels responsive when new content loads
- Product Owner approved: "Every 2 seconds, while 'laggy' in it's own way, I think is better"

#### Decision 3: preserveBubble Parameter Pattern
**Context**: `rescanPage()` called `disableTool()` + `enableTool()`, causing bubble to flash every 2 seconds during scrolling.

**Problem**: `disableTool()` hides bubble when `enabledNames` becomes empty, then `enableTool()` recreates it - visible flash.

**Decision**: Add optional `preserveBubble` parameter to `disableTool()`. When true, skip `hideBubble()` call. `rescanPage()` uses `disableTool(null, true)` for silent reset.

**Rationale**:
- Clean separation between user-initiated disable (hide UI) and programmatic reset (silent)
- Prevents bubble flashing during automatic rescans
- Minimal code change, no architectural impact

### Open Questions Resolved

1. **Multi-part TLDs**: Accept limitation for v1; document as known issue. Users affected are rare.

2. **Subdomain granularity**: Yes, treat all subdomains as same root domain. Disabling `usccb.org` also disables `bible.usccb.org` and `www.usccb.org`. This matches user mental model.

3. **Toast reappearance on new names**: No toast re-shown. However, new names discovered via MutationObserver or manual refresh ARE added to `foundNames` and will appear in the popup/menu when the user opens it. Full functionality preserved, just no repeat notification.

---

## Previous Milestone

**v1.1.2 Status**: COMPLETE - All tasks implemented.

See CHANGELOG.md for details.


