let foundNames = [];
let jsonData = null;
let enabledNames = [];
let isExtensionEnabled = true;

// First, check the extension enabled state from storage
chrome.storage.local.get(['extensionEnabled'], (result) => {
  isExtensionEnabled = result.extensionEnabled !== false; // Default to true
  
  // Update toggle to match stored state
  const toggle = document.getElementById('cbs-popup-global-toggle');
  toggle.checked = isExtensionEnabled;
  
  // If extension is disabled, show a message and stop
  if (!isExtensionEnabled) {
    document.getElementById('cbs-popup-loading').style.display = 'none';
    document.getElementById('cbs-popup-no-names').style.display = 'block';
    const noNamesDiv = document.getElementById('cbs-popup-no-names');
    noNamesDiv.innerHTML = '<p>Extension is currently disabled.</p><p class="cbs-popup-help">Toggle "Extension Enabled" above to activate.</p>';
    return;
  }
  
  // Extension is enabled, query the active tab for found names
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getFoundNames' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not ready or page doesn't support it
        showNoNames();
        return;
      }
      
      if (response && response.names && response.names.length > 0) {
        foundNames = response.names;
        jsonData = response.data;
        enabledNames = response.enabledNames || [];
        
        showContent();
        renderNamesList();
      } else {
        showNoNames();
      }
    });
  });
});

function showContent() {
  document.getElementById('cbs-popup-loading').style.display = 'none';
  document.getElementById('cbs-popup-content').style.display = 'block';
}

function showNoNames() {
  document.getElementById('cbs-popup-loading').style.display = 'none';
  document.getElementById('cbs-popup-no-names').style.display = 'block';
}

function renderNamesList() {
  const container = document.getElementById('cbs-popup-names');
  container.innerHTML = foundNames.map(name => {
    const isEnabled = enabledNames.includes(name);
    const checkboxBg = isEnabled ? '#4285f4' : 'white';
    const checkboxBorder = isEnabled ? '#4285f4' : '#999';
    const checkmarkDisplay = isEnabled ? 'block' : 'none';
    const dataChecked = isEnabled ? 'true' : 'false';
    
    return `
    <label class="cbs-checkbox-label cbs-checkbox-label-custom" data-name="${name}">
      <div class="cbs-custom-checkbox" data-checkbox="${name}" data-checked="${dataChecked}" style="background: ${checkboxBg}; border-color: ${checkboxBorder};">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="display: ${checkmarkDisplay};">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span class="cbs-name">${name}</span>
      <span class="cbs-pronunciation">${jsonData[name].pronunciation}</span>
    </label>
    `;
  }).join('');
  
  // Add custom checkbox functionality
  const customCheckboxLabels = container.querySelectorAll('.cbs-checkbox-label-custom');
  customCheckboxLabels.forEach(label => {
    // Add click to toggle checkbox
    label.addEventListener('click', (e) => {
      e.preventDefault();
      const checkboxDiv = label.querySelector('.cbs-custom-checkbox');
      const checkmark = checkboxDiv.querySelector('svg');
      const isChecked = checkboxDiv.getAttribute('data-checked') === 'true';
      
      if (isChecked) {
        checkboxDiv.setAttribute('data-checked', 'false');
        checkmark.style.display = 'none';
        checkboxDiv.style.background = 'white';
        checkboxDiv.style.borderColor = '#999';
      } else {
        checkboxDiv.setAttribute('data-checked', 'true');
        checkmark.style.display = 'block';
        checkboxDiv.style.background = '#4285f4';
        checkboxDiv.style.borderColor = '#4285f4';
      }
    });
  });
}

// Enable All button
document.getElementById('cbs-popup-enable-all').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'enableAll' });
    window.close();
  });
});

// Disable All button
document.getElementById('cbs-popup-dismiss').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'disableAll' });
    window.close();
  });
});

// Global toggle handler
document.getElementById('cbs-popup-global-toggle').addEventListener('change', (e) => {
  isExtensionEnabled = e.target.checked;
  chrome.storage.local.set({ extensionEnabled: isExtensionEnabled });
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!isExtensionEnabled) {
      // Disable all pronunciations when turning off
      chrome.tabs.sendMessage(tabs[0].id, { action: 'disableAll' });
    } else {
      // When re-enabling, reload the page so content script runs
      chrome.tabs.reload(tabs[0].id);
    }
    window.close();
  });
});

// Enable Selected button
document.getElementById('cbs-popup-enable-selected').addEventListener('click', () => {
  const checkedBoxes = document.querySelectorAll('.cbs-custom-checkbox[data-checked="true"]');
  const selectedNames = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-checkbox'));
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { 
      action: 'updateSelected',
      selectedNames: selectedNames
    });
    window.close();
  });
});