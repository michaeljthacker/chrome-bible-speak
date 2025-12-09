// content.js
console.log('Chrome Bible Speak content script loaded.');

let jsonData = null;
let foundNames = [];
let autoDismissTimer = null;

fetch(chrome.runtime.getURL('names_pronunciations.json'))
  .then(response => response.json())
  .then(data => {
    console.log('JSON data loaded:', data);
    jsonData = data;
    const names = Object.keys(data);
    const bodyText = document.body.innerText;

    // Find all names present on the page
    names.forEach(name => {
      if (bodyText.includes(name)) {
        console.log(`Found name: ${name}`);
        foundNames.push(name);
      }
    });

    // Only show toast if names were found
    if (foundNames.length > 0) {
      showToast();
    }
  })
  .catch(error => console.error('Error loading JSON:', error));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getFoundNames') {
    sendResponse({ names: foundNames, data: jsonData });
  } else if (request.action === 'enableAll') {
    enableTool(jsonData, Object.keys(jsonData));
  } else if (request.action === 'enableSelected') {
    enableTool(jsonData, request.selectedNames);
  } else if (request.action === 'dismiss') {
    hideToast();
    hideSelectionMenu();
  }
  return true;
});

function showToast() {
  // Remove existing toast if any
  const existingToast = document.getElementById('chrome-bible-speak-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'chrome-bible-speak-toast';
  toast.className = 'cbs-toast';
  toast.innerHTML = `
    <div class="cbs-toast-content">
      <div class="cbs-toast-title">BibleSpeak Pronunciations Available</div>
      <div class="cbs-toast-message">${foundNames.length} name${foundNames.length > 1 ? 's' : ''} found on this page</div>
      <div class="cbs-toast-buttons">
        <button id="cbs-pronounce-all" class="cbs-btn cbs-btn-primary">Pronounce All</button>
        <button id="cbs-choose" class="cbs-btn cbs-btn-secondary">Choose</button>
        <button id="cbs-dismiss" class="cbs-btn cbs-btn-text">Dismiss</button>
      </div>
      ${getBrandingFooter()}
    </div>
  `;
  document.body.appendChild(toast);

  // Add event listeners
  document.getElementById('cbs-pronounce-all').addEventListener('click', () => {
    clearTimeout(autoDismissTimer);
    enableTool(jsonData, foundNames);
    hideToast();
  });

  document.getElementById('cbs-choose').addEventListener('click', () => {
    clearTimeout(autoDismissTimer);
    hideToast();
    showSelectionMenu();
  });

  document.getElementById('cbs-dismiss').addEventListener('click', () => {
    clearTimeout(autoDismissTimer);
    hideToast();
  });

  // Auto-dismiss after 7 seconds
  autoDismissTimer = setTimeout(() => {
    hideToast();
  }, 7000);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add('cbs-toast-visible');
  }, 100);
}

function hideToast() {
  const toast = document.getElementById('chrome-bible-speak-toast');
  if (toast) {
    toast.classList.remove('cbs-toast-visible');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
}

function showSelectionMenu() {
  // Remove existing menu if any
  const existingMenu = document.getElementById('chrome-bible-speak-selection');
  if (existingMenu) {
    existingMenu.remove();
  }

  const menu = document.createElement('div');
  menu.id = 'chrome-bible-speak-selection';
  menu.className = 'cbs-selection-menu';
  
  const checkboxesHtml = foundNames.map(name => `
    <label class="cbs-checkbox-label">
      <input type="checkbox" class="cbs-checkbox" value="${name}">
      <span class="cbs-name">${name}</span>
      <span class="cbs-pronunciation">${jsonData[name].pronunciation}</span>
    </label>
  `).join('');

  menu.innerHTML = `
    <div class="cbs-selection-content">
      <div class="cbs-selection-header">
        <div class="cbs-selection-title">Select Pronunciations</div>
        <button id="cbs-selection-close" class="cbs-close-btn">&times;</button>
      </div>
      <div class="cbs-selection-body">
        ${checkboxesHtml}
      </div>
      <div class="cbs-selection-footer">
        <button id="cbs-enable-selected" class="cbs-btn cbs-btn-primary cbs-btn-large">Enable Selected</button>
        <div class="cbs-selection-links">
          <a href="#" id="cbs-enable-all-link" class="cbs-link">Enable All</a>
          <span class="cbs-separator">|</span>
          <a href="#" id="cbs-dismiss-link" class="cbs-link">Dismiss</a>
        </div>
      </div>
      ${getBrandingFooter()}
    </div>
  `;
  document.body.appendChild(menu);

  // Add event listeners
  document.getElementById('cbs-enable-selected').addEventListener('click', () => {
    const checkboxes = menu.querySelectorAll('.cbs-checkbox:checked');
    const selectedNames = Array.from(checkboxes).map(cb => cb.value);
    if (selectedNames.length > 0) {
      enableTool(jsonData, selectedNames);
      hideSelectionMenu();
    }
  });

  document.getElementById('cbs-enable-all-link').addEventListener('click', (e) => {
    e.preventDefault();
    enableTool(jsonData, foundNames);
    hideSelectionMenu();
  });

  document.getElementById('cbs-dismiss-link').addEventListener('click', (e) => {
    e.preventDefault();
    hideSelectionMenu();
  });

  document.getElementById('cbs-selection-close').addEventListener('click', () => {
    hideSelectionMenu();
  });

  // Trigger animation
  setTimeout(() => {
    menu.classList.add('cbs-selection-visible');
  }, 100);
}

function hideSelectionMenu() {
  const menu = document.getElementById('chrome-bible-speak-selection');
  if (menu) {
    menu.classList.remove('cbs-selection-visible');
    setTimeout(() => {
      menu.remove();
    }, 300);
  }
}

function enableTool(data, namesToEnable) {
  console.log('Enabling tool for names:', namesToEnable);

  namesToEnable.forEach(name => {
    const pronunciation = data[name].pronunciation;
    const link = data[name].link;
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    if (document.body.innerHTML.includes(name)) {
      console.log(`Replacing ${name} with ${name} (<a href="${link}" target="_blank">${pronunciation}</a>)`);
      document.body.innerHTML = document.body.innerHTML.replace(regex, `${name} (<a href="${link}" target="_blank">${pronunciation}</a>)`);
    }
  });
}

function getBrandingFooter() {
  return `
    <div class="cbs-branding">
      <span class="cbs-branding-text">An <a href="https://mjt.pub" target="_blank" class="cbs-branding-link">mjt.pub</a> project. Questions? Email <a href="mailto:hi@mjt.pub" class="cbs-branding-link">hi@mjt.pub</a></span>
      <a href="https://buymeacoffee.com/michaeljthacker" target="_blank" class="cbs-coffee-btn">
        <svg class="cbs-coffee-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 21h19v-3H2v3zm16-8c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-1V4c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h1v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3h1zM7 4h8v2H7V4zm-3 4h13v3H4V8z"/>
        </svg>
        Buy me a coffee
      </a>
    </div>
  `;
}