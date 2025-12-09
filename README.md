# Bible Name Aid

A Chrome extension that helps you pronounce biblical names correctly while browsing the web. Bible Name Aid detects biblical names on any webpage and provides clickable pronunciation guides linked to authoritative sources.

## Description

Bible Name Aid automatically scans webpages for biblical names and displays an unobtrusive notification when names are found. You can choose to enable pronunciation aids for all names, select specific ones, or disable the feature entirely. The extension remembers your preferences across browsing sessions.

When enabled, the tool adds pronunciation guides directly in the text; each biblical name gets a clickable phonetic pronunciation that links to the full pronunciation guide on BibleSpeak.org.

## Features

### Smart Detection & Control
- **Automatic Scanning**: Detects biblical names on any webpage you visit
- **Toast Notification**: Shows a clean, auto-dismissing notification when names are found
- **Selection Menu**: Choose exactly which names to enable pronunciation for
- **Quick Access Bubble**: A floating button appears when pronunciations are active for easy access to settings
- **Global Toggle**: Enable or disable the entire extension with one click
- **Persistent State**: Your preferences are saved across tabs, pages, and browser sessions

### Clean Integration
- **Inline Pronunciations**: Adds phonetic guides directly after names (e.g., "Corinthians (*kor-IN-thee-uhns*)")
- **Clickable Links**: Each pronunciation links to the full BibleSpeak.org pronunciation page
- **Non-Intrusive**: No page reload required, preserves all page functionality
- **Minimal UI**: Modern, compact interface that stays out of your way

### Flexible Usage
- **Enable All**: Add pronunciations for every biblical name found on the page
- **Choose Specific Names**: Pick and choose which names get pronunciation aids
- **Disable Selectively**: Remove pronunciations for specific names without affecting others
- **Disable All**: Quickly remove all pronunciation aids from the page

## How to Install Locally

1. Clone the repository:
    ```sh
    git clone https://github.com/michaeljthacker/chrome-bible-speak.git
    ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** using the toggle in the top right corner

4. Click **Load unpacked**

5. Select the directory where you cloned the repository

6. The Bible Name Aid icon will appear in your Chrome toolbar

## Usage

1. **Browse any webpage** - The extension automatically scans for biblical names
2. **See the notification** - A toast appears in the bottom-right if names are found
3. **Choose your action**:
   - **Pronounce All**: Enable pronunciation aids for all detected names
   - **Choose**: Select specific names from a menu
   - **Disable All**: Remove all pronunciation aids
4. **Use the floating bubble** - When pronunciations are active, click the bubble to adjust your selections
5. **Toggle extension on/off** - Use the global toggle in the popup or selection menu
6. **Click pronunciations** - Each phonetic guide links to the full BibleSpeak.org page

## Updating the Pronunciation Database

The extension includes a Python script to refresh the pronunciation data from BibleSpeak.org:

```sh
python updateWordListJSON.py
```

This script:
1. Scrapes biblical names from `https://biblespeak.org/{letter}-words/` for each letter
2. Retrieves phonetic pronunciations from `https://biblespeak.org/{name}-pronunciation/`
3. Updates `names_pronunciations.json` with names, pronunciations, and source links

## Technology Stack

- **Manifest V3** Chrome Extension
- **JavaScript** for content script and popup functionality
- **Python** web scraping with BeautifulSoup for data updates
- **Chrome Storage API** for persistent preferences
- **Custom CSS** with aggressive specificity to work on any website

## Attribution & Legal

### BibleSpeak.org Content

This extension uses publicly available pronunciation data and links from **[BibleSpeak.org](https://biblespeak.org)**. 

**Important notes:**
- BibleSpeak.org is a separate website **not affiliated with or endorsed by** Bible Name Aid.
- All pronunciation data and content from BibleSpeak.org is owned by BibleSpeak.org and their respective copyright holders.
- This extension is a convenience tool that links to their publicly accessible content - we do not claim ownership of their data.
- When you click pronunciation links in this extension, you are visiting BibleSpeak.org directly.

### Trademarks

All trademarks and brand names mentioned (including "BibleSpeak") are the property of their respective owners. They are used here solely for identification and descriptive purposes.

### Privacy

This extension does not collect, store, or transmit any personal data. All processing occurs locally in your browser. See our full [Privacy Policy](PRIVACY_POLICY.md) for details.

## License

Created as a personal project by [Michael J. Thacker](https://mjt.pub). Questions? Email [hi@mjt.pub](mailto:hi@mjt.pub).
