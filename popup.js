let foundNames = [];
let jsonData = null;
let enabledNames = [];
let isExtensionEnabled = true;
let currentDomain = ''; // Track the current page's root domain

/**
 * Extracts the root domain from a hostname (same logic as content.js).
 * @param {string} hostname - The hostname
 * @returns {string} The root domain
 */
function getRootDomain(hostname) {
  let domain = hostname.replace(/^www\./, '');
  const parts = domain.split('.');
  if (parts.length > 2) {
    domain = parts.slice(-2).join('.');
  }
  return domain;
}

// First, check the extension enabled state from storage
chrome.storage.local.get(['extensionEnabled'], (result) => {
  isExtensionEnabled = result.extensionEnabled !== false; // Default to true
  
  // Update toggle to match stored state
  const toggle = document.getElementById('cbs-popup-global-toggle');
  toggle.checked = isExtensionEnabled;
  
  // Query the active tab to initialize domain toggle (regardless of extension state)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    
    // Initialize domain toggle (will be disabled if extension is off)
    initializeDomainToggle(tab);
  });
  
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
    const tab = tabs[0];
    
    chrome.tabs.sendMessage(tab.id, { action: 'getFoundNames' }, (response) => {
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
  
  // Update domain toggle state based on extension state
  const domainToggle = document.getElementById('cbs-popup-domain-toggle');
  const domainToggleContainer = document.getElementById('cbs-domain-toggle-container');
  
  if (domainToggle && domainToggleContainer) {
    if (!isExtensionEnabled) {
      // Disable and turn off domain toggle when extension is disabled
      domainToggle.disabled = true;
      domainToggle.checked = false;
      domainToggleContainer.style.opacity = '0.5';
      domainToggleContainer.style.pointerEvents = 'none';
    } else {
      // Re-enable domain toggle and restore its state when extension is enabled
      domainToggle.disabled = false;
      domainToggleContainer.style.opacity = '1';
      domainToggleContainer.style.pointerEvents = 'auto';
      // Restore state from storage
      if (currentDomain) {
        chrome.storage.local.get(['toastDisabledDomains'], (result) => {
          const disabledDomains = result.toastDisabledDomains || [];
          const isEnabled = !disabledDomains.includes(currentDomain);
          domainToggle.checked = isEnabled;
        });
      }
    }
  }
  
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

/**
 * Initialize the domain toggle based on current tab's URL and stored settings.
 * @param {chrome.tabs.Tab} tab - The active tab
 */
function initializeDomainToggle(tab) {
  const domainToggleContainer = document.getElementById('cbs-domain-toggle-container');
  const domainToggleLabel = document.getElementById('cbs-domain-toggle-label');
  const domainToggle = document.getElementById('cbs-popup-domain-toggle');
  
  const url = tab.url || '';
  
  // Hide toggle on non-http(s) pages
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    domainToggleContainer.style.display = 'none';
    return;
  }
  
  // Extract domain from URL
  try {
    const urlObj = new URL(url);
    currentDomain = getRootDomain(urlObj.hostname);
    
    // Update label with current domain
    domainToggleLabel.textContent = `at ${currentDomain}`;
    
    // Check if domain is in disabled list
    chrome.storage.local.get(['toastDisabledDomains'], (result) => {
      const disabledDomains = result.toastDisabledDomains || [];
      const isEnabled = !disabledDomains.includes(currentDomain);
      domainToggle.checked = isEnabled;
    });
    
    // Disable domain toggle if extension is globally disabled
    if (!isExtensionEnabled) {
      domainToggle.disabled = true;
      domainToggle.checked = false;
      domainToggleContainer.style.opacity = '0.5';
      domainToggleContainer.style.pointerEvents = 'none';
    }
    
    // Add change handler
    domainToggle.addEventListener('change', handleDomainToggleChange);
    
  } catch (error) {
    console.error('Error parsing URL:', error);
    domainToggleContainer.style.display = 'none';
  }
}

/**
 * Handle domain toggle changes.
 * @param {Event} e - The change event
 */
function handleDomainToggleChange(e) {
  const isEnabled = e.target.checked;
  
  chrome.storage.local.get(['toastDisabledDomains'], (result) => {
    let disabledDomains = result.toastDisabledDomains || [];
    
    if (isEnabled) {
      // Remove domain from disabled list
      disabledDomains = disabledDomains.filter(d => d !== currentDomain);
      console.log(`Enabled toast for domain: ${currentDomain}`);
    } else {
      // Add domain to disabled list
      if (!disabledDomains.includes(currentDomain)) {
        disabledDomains.push(currentDomain);
      }
      console.log(`Disabled toast for domain: ${currentDomain}`);
    }
    
    // Save updated list
    chrome.storage.local.set({ toastDisabledDomains: disabledDomains });
  });
}