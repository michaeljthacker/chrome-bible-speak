# chrome-bible-speak

Chrome extension that scans webpages with pronunciations on [BibleSpeak.org](https://biblespeak.org) and adds the phonetic pronunciation guide to the webpage.

## Description

This Chrome extension looks for a list of names (keys from a JSON file) on webpages. If it finds one of the names, a toggle/menu pops up in the corner of the screen with options to enable, disable, or hide the tool.

- **Disable**: Nothing changes (default behavior).
- **Hide**: The toggle/menu goes away.
- **Enable**: The tool adds parentheticals after every name in the list; inside the parentheses is the phonetic pronunciation from the JSON file, hyper-linked to the BibleSpeak webpage for that name.

## Project Features and Details

### Chrome Extension Features

1. **Name Detection**: Scan webpages for a list of names from a JSON file.
2. **Toggle/Menu**: Display a toggle/menu with options to enable, disable, or hide the tool.
3. **Enable Option**: Add parentheticals with phonetic pronunciation and hyperlink to BibleSpeak.org.

### Python Script for JSON Update

1. **Scrape Names**: For each letter of the alphabet, scrape names from `https://biblespeak.org/{letter}-words/`.
2. **Scrape Pronunciations**: For each name, scrape the phonetic pronunciation from `https://biblespeak.org/{name}-pronunciation/`.
3. **Update JSON**: Save the names, phonetic pronunciations, and links to the JSON file.

## Project Plan

1. **Setup File Structure for Chrome Extension**
    - Create necessary files and folders for a Chrome extension (manifest.json, background.js, content.js, popup.html, etc.).
2. **Develop Python Script for JSON Update**
    - Write a Python script to scrape names and pronunciations from BibleSpeak.org and update the JSON file.
3. **Integrate JSON with Chrome Extension**
    - Use the JSON file in the Chrome extension to detect names on webpages and display the toggle/menu with options.
4. **Implement Toggle/Menu Functionality**
    - Add functionality to enable, disable, or hide the tool based on user selection.
5. **Add Phonetic Pronunciations and Hyperlinks**
    - Implement the feature to add parentheticals with phonetic pronunciations and hyperlinks to BibleSpeak.org for detected names.
6. **Testing and Debugging**
    - Test the extension thoroughly and fix any bugs or issues.
7. **Deployment**
    - Prepare the extension for deployment to the Chrome Web Store.