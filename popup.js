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
    <label class="cbs-checkbox-label">
      <input type="checkbox" class="cbs-checkbox" value="${name}">
      <span class="cbs-name">${name}</span>
      <span class="cbs-pronunciation">${jsonData[name].pronunciation}</span>
    </label>
  `).join('');
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
  const checkboxes = document.querySelectorAll('.cbs-checkbox:checked');
  const selectedNames = Array.from(checkboxes).map(cb => cb.value);
  
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