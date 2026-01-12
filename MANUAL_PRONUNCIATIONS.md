# Manual Pronunciations Guide

This guide explains how to add custom pronunciation entries to `manual_pronunciations.json` for biblical names not available on BibleSpeak.org.

## Purpose

The `manual_pronunciations.json` file serves as a **gap-filler** for biblical names missing from the auto-scraped BibleSpeak.org database. Common use cases include:

- **Old Testament names** not yet available on BibleSpeak.org (e.g., Mahershalalhashbaz, Chedorlaomer)
- **Variant spellings** or lesser-known biblical figures
- **Theological terms** or place names from scripture

**Important**: If a name exists in both `manual_pronunciations.json` and the auto-scraped `names_pronunciations.json`, the **BibleSpeak.org version takes precedence** (since it includes an authoritative audio pronunciation and clickable link).

---

## Adding a New Entry

### Step 1: Locate the File

Open `manual_pronunciations.json` in your project root directory.

### Step 2: Add Your Entry

Follow this JSON format:

```json
{
  "NameToAdd": {
    "pronunciation": "NAME-pronunciation-HERE"
  }
}
```

**Example**:

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

### Step 3: Follow the Pronunciation Style

Use **BibleSpeak.org conventions** for consistency:

#### Hyphenation
- Separate syllables with hyphens: `MAY-hur-SHAL-al-HASH-baz`
- No spaces within the pronunciation

#### Capitalization
- **UPPERCASE** for stressed/emphasized syllables: `MAY`, `SHAL`, `HASH`
- **lowercase** for unstressed syllables: `hur`, `al`, `baz`

#### Common Sound Patterns
- `AY` for long A (as in "day"): `MAY`, `SAY`, `RAY`
- `EE` for long E (as in "see"): `SEE`, `LEE`, `BEE`  
- `AI` for long I (as in "eye"): `AI-zik` (Isaac)
- `OH` for long O (as in "go"): `OH-mer`, `MOH-zehz`
- `OO` for "oo" sound (as in "food"): `LOO-ther`
- `UH` for schwa sound (as in "sofa"): `uh-BRAM`

#### Reference Examples
Consult [BibleSpeak.org](https://biblespeak.org) for similar names to match the pronunciation style:
- Abraham: `AY-bruh-ham`
- Nebuchadnezzar: `neb-uh-kuhd-NEZ-er`
- Isaiah: `ai-ZAY-uh`
- Jehoshaphat: `jih-HOSH-uh-fat`

### Step 4: Important Rules

**✓ DO**:
- Include the `"pronunciation"` field (required)
- Use exact capitalization for the name key (case-sensitive)
- Follow BibleSpeak.org formatting conventions
- Validate JSON syntax (commas, quotes, braces)

**✗ DO NOT**:
- Add a `"link"` field - links are reserved for auto-scraped BibleSpeak entries only
- Use IPA (International Phonetic Alphabet) notation
- Include audio files or external resources

---

## Example: Adding Multiple Names

```json
{
  "Mahershalalhashbaz": {
    "pronunciation": "MAY-hur-SHAL-al-HASH-baz"
  },
  "Chedorlaomer": {
    "pronunciation": "ked-or-lay-OH-mer"
  },
  "Zerubbabel": {
    "pronunciation": "zuh-RUB-uh-bel"
  }
}
```

**Note**: Remember to add a comma after each entry except the last one (standard JSON formatting).

---

## Validation

Before packaging the extension, the build script automatically validates `manual_pronunciations.json`:

```sh
python validate_manual_pronunciations.py
```

The validator checks:
- ✓ Valid JSON syntax
- ✓ Required `"pronunciation"` field present
- ✓ No forbidden `"link"` field
- ⚠ Basic pronunciation format consistency (warnings only)

**Build will fail if validation errors are found**, ensuring broken entries never get packaged.

---

## Testing Your Entry

After adding a new pronunciation:

1. **Reload the extension** in Chrome (`chrome://extensions/` → click reload icon)
2. **Visit a webpage** containing your new name
3. **Verify detection**: Toast notification should include your name
4. **Enable pronunciation**: Select your name and confirm it renders correctly
5. **Check styling**: Manual entries display without hyperlinks (plain italic text)

---

## Precedence Rules

When a name exists in **both** files:

| File | Precedence | Reason |
|------|------------|--------|
| `names_pronunciations.json` (BibleSpeak.org) | **HIGH** | Authoritative source with audio |
| `manual_pronunciations.json` (manual) | Low | Gap-filler only |

**Example**:
- If you add `"Abraham"` to `manual_pronunciations.json`, it will be **ignored** because `Abraham` already exists in the BibleSpeak.org data
- The auto-scraped version includes a clickable link to hear the pronunciation
- Manual entries should only be added for names **not available on BibleSpeak.org**

---

## Troubleshooting

### "Build failed: validation errors"
- Check JSON syntax (commas, quotes, braces)
- Ensure `"pronunciation"` field is present for all entries
- Remove any `"link"` fields from manual entries

### "Name not detected on page"
- Verify exact spelling matches the page text (case-insensitive, but must match)
- Check browser console for errors (`F12` → Console tab)
- Ensure name key uses correct capitalization

### "Pronunciation displays with wrong case"
- Phase 1 bug fixes should preserve case automatically
- If issue persists, check that Phase 1 implementation is deployed

---

## Questions or Issues?

Created by [Michael J. Thacker](https://mjt.pub). Questions? Email [hi@mjt.pub](mailto:hi@mjt.pub).
