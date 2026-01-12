# Chrome Web Store Submission Checklist

## ✅ Completed (Ready for Submission)

### Build System
- ✅ `scripts/build_extension.ps1` - PowerShell build script that creates `dist/` folder and ZIP
- ✅ `.gitignore` updated to exclude `dist/` and `*.zip`
- ✅ Only essential files copied to dist (no Python scripts, no dev files)

### Manifest
- ✅ `manifest_version: 3` (required)
- ✅ Name: "Bible Name Aid"
- ✅ Version: "1.0.0"
- ✅ Description: Clear, concise, under 132 characters
- ✅ Permissions: Only `activeTab` and `storage` (minimal)
- ✅ Icons: All sizes present (16/32/48/64/128/256)

### Legal & Privacy
- ✅ `PRIVACY_POLICY.md` - Comprehensive privacy policy
- ✅ Public GitHub URL for privacy policy: https://github.com/michaeljthacker/chrome-bible-speak/blob/main/PRIVACY_POLICY.md
- ✅ README.md updated with BibleSpeak.org attribution
- ✅ Clear disclaimer that BibleSpeak.org is not affiliated

### Assets
- ✅ All icon sizes present in `/icons/` folder
- ✅ Icons are square PNGs
- ✅ Extension name updated to "Bible Name Aid" throughout

## 📋 TODO (Manual Steps)

### 1. Build the Extension
```powershell
# Run from project root
.\scripts\build_extension.ps1
```

This creates:
- `dist/` folder with clean extension files
- `bible-name-aid-dist.zip` ready for upload

### 2. Test the Build
1. Open Chrome → Extensions → Enable "Developer mode"
2. Click "Load unpacked"
3. Select the `dist/` folder
4. Test all features work correctly

### 3. Take Screenshots
Needed for Chrome Web Store listing:

**Screenshot 1: In Action**
- Show a Bible webpage (e.g., Bible Gateway, YouVersion, ESV.org)
- With Bible Name Aid pronunciations visible
- Example: "David (DAY-vid)" or "Moses (MO-zehs)" on page

**Screenshot 2: UI Close-up**
- Show the popup menu with toggle and name selection
- Or the toast notification when names are found

**Requirements:**
- 1280x800 or 640x400 pixels recommended
- PNG or JPEG format
- At least 1 screenshot required, up to 5 allowed

### 4. Chrome Web Store Submission

Go to: https://chrome.google.com/webstore/devconsole

**Store Listing Info:**

**Product Name:** Bible Name Aid

**Summary (132 chars max):**
```
Adds phonetic pronunciations for Biblical names on webpages, sourced from BibleSpeak.org.
```

**Description (16,000 chars max):**
```
Bible Name Aid helps you read the Bible confidently by adding phonetic pronunciation guides for Biblical names directly on webpages.

✨ Features:
• Automatically detects Biblical names on any webpage
• Adds clickable pronunciation guides in parentheses
• Toggle pronunciations on/off globally or per-name
• Links to BibleSpeak.org for audio pronunciations
• Works on Bible Gateway, YouVersion, ESV.org, and more
• Clean, modern interface with zero data collection

🔒 Privacy:
• No tracking, no analytics, no data collection
• All processing happens locally in your browser
• No account required

📚 Pronunciation Data:
All pronunciation data is sourced from BibleSpeak.org, a comprehensive database of Biblical name pronunciations. This extension is not affiliated with or endorsed by BibleSpeak.org.

Perfect for:
• Bible study groups
• Sunday school teachers
• Anyone reading scripture aloud
• New Christians learning Biblical names
• Theologians and seminary students
```

**Category:** Productivity

**Language:** English

**Privacy Policy URL:**
```
https://github.com/michaeljthacker/chrome-bible-speak/blob/main/PRIVACY_POLICY.md
```

**Support/Homepage URL:**
```
https://github.com/michaeljthacker/chrome-bible-speak
```

**Upload:**
- Upload `bible-name-aid-dist.zip`
- Upload 1-5 screenshots (1280x800 recommended)
- Upload 128x128 icon (use `icons/BibleSpeakIcon_128.png`)

**Pricing:**
- Free

**Single Purpose Description:**
```
This extension adds phonetic pronunciation guides for Biblical names on webpages to help users read scripture correctly and confidently.
```

**Host Permission Justification:**
```
<all_urls>: Required to automatically detect and add pronunciation guides for Biblical names on any webpage the user visits, including Bible study websites, church sites, and general web content containing scripture references.
```

**Justification for Permissions:**
```
activeTab: Required to read webpage content and add pronunciation guides
storage: Required to save user preferences (on/off state, selected names)
```

### 5. After Submission

**Review Time:** Usually 1-3 business days

**What Google Reviews:**
- ✅ Privacy policy presence and clarity
- ✅ Minimal permissions (we only use 2)
- ✅ Clear description of functionality
- ✅ No malicious code or obfuscation
- ✅ Icons and screenshots quality

**Post-Approval:**
- Extension will be live in Chrome Web Store
- Get shareable link like: `chrome.google.com/webstore/detail/[extension-id]`
- Can update by uploading new ZIPs (version number must increment)

## 🚀 Quick Build & Test Commands

```powershell
# Build for submission
.\scripts\build_extension.ps1

# Test that ZIP extracts correctly
Expand-Archive -Path bible-name-aid-dist.zip -DestinationPath test-extract -Force

# Check file count (should be ~10 files)
(Get-ChildItem -Recurse test-extract -File).Count
```

## 📞 Support

Questions during submission? Email hi@mjt.pub or open a GitHub issue.
