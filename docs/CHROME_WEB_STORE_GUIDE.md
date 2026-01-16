# Chrome Web Store Release Process

This guide covers the complete process for releasing new versions of Bible Name Aid to the Chrome Web Store.

---

## 📋 Pre-Release Checklist

### 1. Determine Version Number

Follow [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH):

**MAJOR (x.0.0)** - Breaking changes:
- Incompatible API changes
- Major architecture overhaul
- Changes that break existing user workflows

**MINOR (1.x.0)** - New features (backwards compatible):
- New functionality added
- Significant enhancements
- New pronunciation sources or major name additions (50+)

**PATCH (1.1.x)** - Bug fixes and minor updates:
- Bug fixes
- Performance improvements
- Small name additions (<50)
- Documentation updates
- Build process improvements

**Current Version:** Check `manifest.json` → `version` field

### 2. Update Project Files

#### a. Update `manifest.json`
```json
{
  "version": "1.x.x"  // Bump to new version
}
```

#### b. Update `plans/CHANGELOG.md`

Add new version section at the top:
```markdown
## [vX.X.X] - Month Day, YEAR

### Added
- New features or capabilities

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Technical Changes
- Internal improvements, refactoring, etc.
```

#### c. Review `plans/backlog.md`
- Move completed items out of backlog
- Update status of in-progress items
- Add any new issues discovered

#### d. Review `README.md` (if needed)
- Update version badges if present
- Ensure installation instructions are current
- Update feature list if new features added

### 3. Commit All Changes

```powershell
# Stage all changes
git add .

# Commit with version number
git commit -m "v1.x.x: [Brief description of release]"

# Push to main
git push origin main
```

### 4. Tag the Release

```powershell
# Create annotated tag
git tag -a v1.x.x -m "Release v1.x.x - [Brief description]"

# Push tag to remote
git push origin v1.x.x

# Verify tag was created
git tag
```

---

## 🔨 Build & Test

### 1. Build the Extension

```powershell
# Run from project root
.\scripts\build_extension.ps1
```

This creates:
- `dist/` folder with clean extension files
- `bible-name-aid-dist.zip` ready for upload

### 2. Test the Build Locally

```powershell
# Load extension in Chrome
# 1. Open Chrome → Extensions (chrome://extensions/)
# 2. Enable "Developer mode" (top-right toggle)
# 3. Click "Load unpacked"
# 4. Select the `dist/` folder
```

**Test Checklist:**
- ✅ Extension loads without errors
- ✅ Icon appears in toolbar
- ✅ Popup opens and displays correctly
- ✅ Pronunciations inject on test pages
- ✅ Toggle on/off works
- ✅ Selected names feature works
- ✅ Links to BibleSpeak.org work

---

## 🚀 Chrome Web Store Submission

### Access Developer Dashboard

Go to: https://chrome.google.com/webstore/devconsole

### For Updates (v1.1.0+)

1. Click on "Bible Name Aid" in your developer dashboard
2. Click "Package" tab on the left
3. Click "Upload new package"
4. Upload `bible-name-aid-dist.zip`
5. Update "What's New" section (required):
   - Write 2-3 sentences summarizing changes
   - Pull from CHANGELOG.md for this version
6. (Optional) Update store listing ONLY if major UI or feature changes
7. Click "Submit for review"

**"What's New" Examples:**
```
v1.1.2: Added support for major biblical figures like Paul and the disciples, plus improved pronunciation database organization.

v1.1.1: Fixed critical bug where pronunciations were injected multiple times or nested within compound names.

v1.2.0: New manual pronunciation database with 200+ curated entries, plus alphabetical name sorting in the UI.
```

### Screenshots (RARE - Major Releases Only)

Only update screenshots if:
- Major UI redesign
- Significant new visual features
- Initial v1.0.0 release

Otherwise, skip this step.

**Review Time:** Usually 1-3 business days

---

## ✅ Post-Release

### 1. Monitor Review Status
Check developer dashboard for approval (usually 1-3 days)

### 2. After Approval
- [ ] Verify extension is live in Chrome Web Store
- [ ] Test installation from store (not dev mode)
- [ ] Update any external documentation if needed

### 3. Create GitHub Release (Optional)

On GitHub:
1. Go to Releases → "Draft a new release"
2. Select the tag you created (v1.x.x)
3. Set release title: "v1.x.x - [Brief description]"
4. Copy CHANGELOG.md section into description
5. Attach `bible-name-aid-dist.zip`
6. Publish release

---

## 🚨 Troubleshooting

**"Version must be higher than current version"**
- Update version in manifest.json
- Rebuild with updated manifest

**Review rejection for permissions**
- Ensure justification clearly explains `<all_urls>` need
- Bible name detection requires content access on any page

**Build script fails**
- Run from project root directory
- Check PowerShell execution policy

---

## 📞 Support

Questions? Email hi@mjt.pub or open a GitHub issue.
