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

To **refresh the JSON pronunciation file**, run the following command in the terminal:

```sh
python updateWordListJSON.py
```

## How to Install Locally

1. Clone the repository:
    ```sh
    git clone https://github.com/michaeljthacker/chrome-bible-speak.git
    ```

2. Open Chrome and go to `chrome://extensions/`.

3. Enable "Developer mode" by toggling the switch in the top right corner.

4. Click on the "Load unpacked" button.

5. Select the directory where you cloned the repository.

## Project Plan

### Completed Steps

1. Setup File Structure for Chrome Extension
2. Develop Python Script for JSON Update
3. Integrate JSON with Chrome Extension
4. Implement Toggle/Menu Functionality
5. Add Phonetic Pronunciations and Hyperlinks
6. Testing and Debugging

### Future Steps

7. **Personal Use**
    - Package the extension as a `.zip` file.
    - Load the extension in Chrome as an unpacked extension for personal use.

8. **Optional:** Deployment
    - Prepare the extension for deployment to the Chrome Web Store.