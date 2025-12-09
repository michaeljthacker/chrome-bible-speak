let foundNames = [];
let jsonData = null;

// Query the active tab for found names
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
      showContent();
      renderNamesList();
    } else {
      showNoNames();
    }
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
  container.innerHTML = foundNames.map(name => `
    <label class="cbs-checkbox-label cbs-checkbox-label-custom" data-name="${name}">
      <div class="cbs-custom-checkbox" data-checkbox="${name}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="display: none;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span class="cbs-name">${name}</span>
      <span class="cbs-pronunciation">${jsonData[name].pronunciation}</span>
    </label>
  `).join('');
  
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

// Dismiss button
document.getElementById('cbs-popup-dismiss').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'dismiss' });
    window.close();
  });
});

// Enable Selected button
document.getElementById('cbs-popup-enable-selected').addEventListener('click', () => {
  const checkedBoxes = document.querySelectorAll('.cbs-custom-checkbox[data-checked="true"]');
  const selectedNames = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-checkbox'));
  
  if (selectedNames.length > 0) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'enableSelected',
        selectedNames: selectedNames
      });
      window.close();
    });
  }
});