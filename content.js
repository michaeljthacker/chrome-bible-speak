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
    bottom: 20px !important;
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
    width: 360px !important;
    max-height: 75vh !important;
    opacity: 0 !important;
    transition: all 0.3s ease !important;
    overflow: hidden !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    display: flex !important;
    flex-direction: column !important;
  `;
  
  const checkboxesHtml = foundNames.map(name => `
    <label class="cbs-checkbox-label-custom" data-name="${name}" style="display: flex !important; align-items: center !important; padding: 12px !important; border-radius: 8px !important; cursor: pointer !important; transition: background 0.2s !important; gap: 12px !important; margin: 0 !important; font-family: inherit !important; background: transparent !important;">
      <div class="cbs-custom-checkbox" data-checkbox="${name}" style="width: 18px !important; height: 18px !important; min-width: 18px !important; min-height: 18px !important; border: 2px solid #999 !important; border-radius: 3px !important; background: white !important; cursor: pointer !important; flex-shrink: 0 !important; margin: 0 !important; padding: 0 !important; position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important;">
        <svg style="width: 12px !important; height: 12px !important; display: none !important; color: white !important; stroke: white !important;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span style="font-weight: 500 !important; color: #1a1a1a !important; min-width: 100px !important; font-size: 14px !important; font-family: inherit !important; margin: 0 !important;">${name}</span>
      <span style="color: #666 !important; font-size: 14px !important; font-style: italic !important; font-family: inherit !important; margin: 0 !important;">${jsonData[name].pronunciation}</span>
    </label>
  `).join('');

  menu.innerHTML = `
    <div style="display: flex !important; flex-direction: column !important; height: 100% !important; overflow: hidden !important;">
      <div style="padding: 16px 20px !important; border-bottom: 1px solid #e5e5e5 !important; background: #f8f9fa !important; flex-shrink: 0 !important;">
        <h1 style="margin: 0 !important; font-size: 18px !important; font-weight: 600 !important; color: #1a1a1a !important; font-family: inherit !important; line-height: 1.4 !important;">BibleSpeak Pronunciations</h1>
      </div>
      <div style="padding: 16px 20px !important; display: flex !important; flex-direction: column !important; gap: 8px !important; flex-shrink: 0 !important;">
        <button id="cbs-enable-all-btn" style="padding: 14px 24px !important; border: none !important; border-radius: 8px !important; font-size: 15px !important; font-weight: 500 !important; cursor: pointer !important; transition: all 0.2s !important; font-family: inherit !important; white-space: nowrap !important; background: #4285f4 !important; color: white !important; width: 100% !important; margin: 0 !important; line-height: 1.4 !important;">Enable All Pronunciations</button>
        <button id="cbs-dismiss-btn" style="padding: 14px 24px !important; border: none !important; border-radius: 8px !important; font-size: 15px !important; font-weight: 500 !important; cursor: pointer !important; transition: all 0.2s !important; font-family: inherit !important; white-space: nowrap !important; background: #f1f3f4 !important; color: #5f6368 !important; width: 100% !important; margin: 0 !important; line-height: 1.4 !important;">Dismiss</button>
      </div>
      <div style="text-align: center !important; padding: 10px 20px !important; color: #999 !important; font-size: 12px !important; position: relative !important; flex-shrink: 0 !important;">
        <span style="background: white !important; padding: 0 12px !important; position: relative !important; z-index: 1 !important; font-family: inherit !important; margin: 0 !important;">or choose specific names</span>
        <div style="position: absolute !important; top: 50% !important; left: 20px !important; width: 25% !important; height: 1px !important; background: #e5e5e5 !important; z-index: 0 !important;"></div>
        <div style="position: absolute !important; top: 50% !important; right: 20px !important; width: 25% !important; height: 1px !important; background: #e5e5e5 !important; z-index: 0 !important;"></div>
      </div>
      <div style="padding: 8px 20px 12px !important; max-height: 200px !important; overflow-y: auto !important; flex: 1 !important;">
        ${checkboxesHtml}
      </div>
      <div style="padding: 12px 20px !important; border-top: 1px solid #e5e5e5 !important; flex-shrink: 0 !important;">
        <button id="cbs-enable-selected" style="padding: 10px 20px !important; border: none !important; border-radius: 8px !important; font-size: 14px !important; font-weight: 500 !important; cursor: pointer !important; transition: all 0.2s !important; font-family: inherit !important; white-space: nowrap !important; background: #4285f4 !important; color: white !important; width: 100% !important; margin: 0 !important; line-height: 1.4 !important;">Enable Selected</button>
      </div>
      <div style="margin-top: 0 !important; padding: 12px 20px !important; border-top: 1px solid #e5e5e5 !important; flex-shrink: 0 !important;">
        ${getBrandingFooter()}
      </div>
    </div>
  `;
  document.body.appendChild(menu);

  // Add custom checkbox functionality
  const customCheckboxLabels = menu.querySelectorAll('.cbs-checkbox-label-custom');
  customCheckboxLabels.forEach(label => {
    // Add hover effect
    label.addEventListener('mouseenter', () => {
      label.style.background = '#f8f8f8';
    });
    label.addEventListener('mouseleave', () => {
      label.style.background = 'transparent';
    });
    
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

  // Add event listeners
  document.getElementById('cbs-enable-all-btn').addEventListener('click', () => {
    enableTool(jsonData, foundNames);
    hideSelectionMenu();
  });

  document.getElementById('cbs-dismiss-btn').addEventListener('click', () => {
    hideSelectionMenu();
  });

  document.getElementById('cbs-enable-selected').addEventListener('click', () => {
    const checkedBoxes = menu.querySelectorAll('.cbs-custom-checkbox[data-checked="true"]');
    const selectedNames = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-checkbox'));
    if (selectedNames.length > 0) {
      enableTool(jsonData, selectedNames);
      hideSelectionMenu();
    }
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

  // Create a map for quick lookup
  const nameMap = {};
  namesToEnable.forEach(name => {
    nameMap[name] = {
      pronunciation: data[name].pronunciation,
      link: data[name].link
    };
  });

  // Function to process text nodes
  function processTextNode(node) {
    let text = node.textContent;
    let modified = false;
    
    namesToEnable.forEach(name => {
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      if (regex.test(text)) {
        const info = nameMap[name];
        const replacement = `${name} (${info.pronunciation})`;
        text = text.replace(regex, replacement);
        modified = true;
      }
    });
    
    if (modified) {
      // Create a temporary container to parse the new content
      const span = document.createElement('span');
      span.innerHTML = text;
      
      // Replace text node with new content
      const parent = node.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, node);
      }
      parent.removeChild(node);
    }
  }

  // Function to traverse DOM and process text nodes
  function traverseDOM(node) {
    // Skip our own extension elements
    if (node.id === 'chrome-bible-speak-toast' || 
        node.id === 'chrome-bible-speak-selection') {
      return;
    }
    
    if (node.nodeType === Node.TEXT_NODE) {
      processTextNode(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Don't traverse script or style tags
      if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
        const children = Array.from(node.childNodes);
        children.forEach(child => traverseDOM(child));
      }
    }
  }

  // Start traversal from body
  traverseDOM(document.body);
  
  // Now add the links in a second pass
  namesToEnable.forEach(name => {
    const info = nameMap[name];
    const regex = new RegExp(`\\b${name} \\(${info.pronunciation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
    
    // Find all text nodes containing the pattern
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip our extension elements
          if (node.parentElement && 
              (node.parentElement.closest('#chrome-bible-speak-toast') ||
               node.parentElement.closest('#chrome-bible-speak-selection'))) {
            return NodeFilter.FILTER_REJECT;
          }
          return regex.test(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    const nodesToReplace = [];
    let currentNode;
    while (currentNode = walker.nextNode()) {
      nodesToReplace.push(currentNode);
    }
    
    nodesToReplace.forEach(node => {
      const text = node.textContent;
      const parts = text.split(regex);
      const matches = text.match(regex) || [];
      
      if (matches.length > 0) {
        const fragment = document.createDocumentFragment();
        
        parts.forEach((part, index) => {
          if (part) {
            fragment.appendChild(document.createTextNode(part));
          }
          if (index < matches.length) {
            const link = document.createElement('a');
            link.href = info.link;
            link.target = '_blank';
            link.style.cssText = 'color: #4285f4 !important; text-decoration: none !important; font-style: italic !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important;';
            link.textContent = info.pronunciation;
            
            const wrapper = document.createDocumentFragment();
            wrapper.appendChild(document.createTextNode(`${name} (`));
            wrapper.appendChild(link);
            wrapper.appendChild(document.createTextNode(')'));
            
            fragment.appendChild(wrapper);
          }
        });
        
        node.parentNode.replaceChild(fragment, node);
      }
    });
  });
}

function getBrandingFooter() {
  return `
    <div style="display: flex !important; flex-direction: column !important; gap: 8px !important; font-size: 11px !important; font-family: inherit !important;">
      <span style="color: #666 !important; text-align: center !important; line-height: 1.4 !important; margin: 0 !important; font-family: inherit !important;">An <a href="https://mjt.pub" target="_blank" style="color: #4285f4 !important; text-decoration: none !important; font-family: inherit !important;">mjt.pub</a> project. Questions? Email <a href="mailto:hi@mjt.pub" style="color: #4285f4 !important; text-decoration: none !important; font-family: inherit !important;">hi@mjt.pub</a></span>
      <a href="https://buymeacoffee.com/michaeljthacker" target="_blank" style="display: inline-flex !important; align-items: center !important; gap: 6px !important; padding: 6px 12px !important; background: #FFDD00 !important; color: #000 !important; text-decoration: none !important; border-radius: 6px !important; font-size: 12px !important; font-weight: 500 !important; transition: all 0.2s !important; align-self: center !important; font-family: inherit !important; margin: 0 !important; line-height: 1.4 !important;">
        <svg style="width: 16px !important; height: 16px !important; flex-shrink: 0 !important;" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 21h19v-3H2v3zm16-8c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-1V4c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h1v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3h1zM7 4h8v2H7V4zm-3 4h13v3H4V8z"/>
        </svg>
        Buy me a coffee
      </a>
    </div>
  `;
}