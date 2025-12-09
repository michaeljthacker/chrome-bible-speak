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
      // Ensure DOM is fully loaded before showing toast
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showToast);
      } else {
        showToast();
      }
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
  console.log('Attempting to show toast...');
  // Remove existing toast if any
  const existingToast = document.getElementById('chrome-bible-speak-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'chrome-bible-speak-toast';
  toast.className = 'cbs-toast';
  
  // Apply critical styles inline to prevent website CSS from overriding
  toast.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    z-index: 2147483647 !important;
    background: white !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
    padding: 20px !important;
    max-width: 380px !important;
    opacity: 0 !important;
    transform: translateY(-20px) !important;
    transition: all 0.3s ease !important;
    pointer-events: auto !important;
  `;
  
  toast.innerHTML = `
    <div class="cbs-toast-content" style="display: flex; flex-direction: column; gap: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div class="cbs-toast-title" style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0; line-height: 1.4;">BibleSpeak Pronunciations Available</div>
      <div class="cbs-toast-message" style="font-size: 14px; color: #666; margin: 0; line-height: 1.4;">${foundNames.length} name${foundNames.length > 1 ? 's' : ''} found on this page</div>
      <div class="cbs-toast-buttons" style="display: flex; gap: 8px; margin-top: 8px;">
        <button id="cbs-pronounce-all" style="padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; white-space: nowrap; background: #4285f4; color: white;">Pronounce All</button>
        <button id="cbs-choose" style="padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; white-space: nowrap; background: #f1f3f4; color: #5f6368;">Choose</button>
        <button id="cbs-dismiss" style="padding: 10px 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; white-space: nowrap; background: none; color: #5f6368;">Dismiss</button>
      </div>
    </div>
  `;
  document.body.appendChild(toast);
  console.log('Toast appended to body');
  console.log('Toast element:', toast);
  console.log('Toast parent:', toast.parentElement);
  console.log('Toast bounding rect:', toast.getBoundingClientRect());

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
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    console.log('Toast visibility styles applied, checking if visible:', {
      opacity: window.getComputedStyle(toast).opacity,
      display: window.getComputedStyle(toast).display,
      position: window.getComputedStyle(toast).position,
      zIndex: window.getComputedStyle(toast).zIndex,
      top: window.getComputedStyle(toast).top,
      right: window.getComputedStyle(toast).right
    });
  }, 100);
}

function hideToast() {
  const toast = document.getElementById('chrome-bible-speak-toast');
  if (toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
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
  
  // Apply critical styles inline to prevent website CSS from overriding
  menu.style.cssText = `
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) scale(0.9) !important;
    background: white !important;
    border-radius: 16px !important;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2) !important;
    z-index: 2147483647 !important;
    width: 90% !important;
    max-width: 500px !important;
    max-height: 80vh !important;
    opacity: 0 !important;
    transition: all 0.3s ease !important;
  `;
  
  const checkboxesHtml = foundNames.map(name => `
    <label style="display: flex; align-items: center; padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s; gap: 12px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <input type="checkbox" value="${name}" style="width: 18px; height: 18px; cursor: pointer; flex-shrink: 0; margin: 0;">
      <span style="font-weight: 500; color: #1a1a1a; min-width: 100px; font-size: 14px;">${name}</span>
      <span style="color: #666; font-size: 14px; font-style: italic;">${jsonData[name].pronunciation}</span>
    </label>
  `).join('');

  menu.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e5e5;">
        <div style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0;">Select Pronunciations</div>
        <button id="cbs-selection-close" style="background: none; border: none; font-size: 28px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s; font-family: inherit; line-height: 1;">&times;</button>
      </div>
      <div style="padding: 16px 24px; overflow-y: auto; flex: 1;">
        ${checkboxesHtml}
      </div>
      <div style="padding: 20px 24px; border-top: 1px solid #e5e5e5; display: flex; flex-direction: column; gap: 12px;">
        <button id="cbs-enable-selected" style="padding: 14px 24px; border: none; border-radius: 8px; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; white-space: nowrap; background: #4285f4; color: white; width: 100%;">Enable Selected</button>
        <div style="display: flex; justify-content: center; gap: 8px; align-items: center; font-size: 14px;">
          <a href="#" id="cbs-enable-all-link" style="color: #4285f4; text-decoration: none; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;">Enable All</a>
          <span style="color: #ccc;">|</span>
          <a href="#" id="cbs-dismiss-link" style="color: #4285f4; text-decoration: none; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;">Dismiss</a>
        </div>
      </div>
      ${getBrandingFooter()}
    </div>
  `;
  document.body.appendChild(menu);

  // Add event listeners
  document.getElementById('cbs-enable-selected').addEventListener('click', () => {
    const checkboxes = menu.querySelectorAll('input[type="checkbox"]:checked');
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
    menu.style.opacity = '1';
    menu.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 100);
}

function hideSelectionMenu() {
  const menu = document.getElementById('chrome-bible-speak-selection');
  if (menu) {
    menu.style.opacity = '0';
    menu.style.transform = 'translate(-50%, -50%) scale(0.9)';
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
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e5e5; display: flex; flex-direction: column; gap: 8px; font-size: 11px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <span style="color: #666; text-align: center; line-height: 1.4;">An <a href="https://mjt.pub" target="_blank" style="color: #4285f4; text-decoration: none;">mjt.pub</a> project. Questions? Email <a href="mailto:hi@mjt.pub" style="color: #4285f4; text-decoration: none;">hi@mjt.pub</a></span>
      <a href="https://buymeacoffee.com/michaeljthacker" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #FFDD00; color: #000; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 500; transition: all 0.2s; align-self: center; font-family: inherit;">
        <svg style="width: 16px; height: 16px; flex-shrink: 0;" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 21h19v-3H2v3zm16-8c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-1V4c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h1v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3h1zM7 4h8v2H7V4zm-3 4h13v3H4V8z"/>
        </svg>
        Buy me a coffee
      </a>
    </div>
  `;
}