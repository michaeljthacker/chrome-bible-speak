// content.js
console.log('Chrome Bible Speak content script loaded.');

let jsonData = null;
let foundNames = [];
let enabledNames = []; // Track which names currently have pronunciations shown
let autoDismissTimer = null;
let isExtensionEnabled = true; // Global on/off state

// Check if extension is globally enabled
if (chrome && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['extensionEnabled'], (result) => {
    isExtensionEnabled = result.extensionEnabled !== false; // Default to true
    if (!isExtensionEnabled) {
      console.log('Extension is globally disabled');
      return;
    }
    
    // Load JSON and check for names only if enabled
    loadAndCheckNames();
  });
} else {
  // Fallback if storage not available - just load normally
  console.log('Chrome storage not available, proceeding with default enabled state');
  loadAndCheckNames();
}

function loadAndCheckNames() {
fetch(chrome.runtime.getURL('names_pronunciations.json'))
  .then(response => response.json())
  .then(data => {
    console.log('JSON data loaded:', data);
    jsonData = data;
    
    // Skip if no body element (e.g., viewing SVG/XML files directly)
    if (!document.body) {
      console.log('No document.body found, skipping extension functionality');
      return;
    }
    
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
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getFoundNames') {
    sendResponse({ names: foundNames, enabledNames: enabledNames, data: jsonData, isExtensionEnabled: isExtensionEnabled });
  } else if (request.action === 'enableAll') {
    enableTool(jsonData, foundNames);
  } else if (request.action === 'enableSelected') {
    enableTool(jsonData, request.selectedNames);
  } else if (request.action === 'updateSelected') {
    // Disable names that were unchecked
    const namesToDisable = enabledNames.filter(name => !request.selectedNames.includes(name));
    if (namesToDisable.length > 0) {
      disableTool(namesToDisable);
    }
    // Enable newly checked names
    const namesToEnable = request.selectedNames.filter(name => !enabledNames.includes(name));
    if (namesToEnable.length > 0) {
      enableTool(jsonData, namesToEnable);
    }
  } else if (request.action === 'disableAll') {
    disableTool();
  } else if (request.action === 'toggleExtension') {
    isExtensionEnabled = request.enabled;
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ extensionEnabled: request.enabled });
    }
    sendResponse({ success: true });
  } else if (request.action === 'getExtensionState') {
    sendResponse({ isExtensionEnabled: isExtensionEnabled });
  } else if (request.action === 'dismiss') {
    hideToast();
    hideSelectionMenu();
  }
  return true; // Keep message channel open for async responses
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
    <div style="display: flex !important; flex-direction: column !important; gap: 12px !important; font-family: inherit !important;">
      <div class="cbs-toast-title" style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0; line-height: 1.4;">Bible Name Aid</div>
      <div class="cbs-toast-message" style="font-size: 14px; color: #666; margin: 0; line-height: 1.4;">${foundNames.length} name${foundNames.length > 1 ? 's' : ''} found on this page</div>
      <div class="cbs-toast-buttons" style="display: flex; gap: 8px; margin-top: 8px;">
        <button id="cbs-pronounce-all" style="padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; white-space: nowrap; background: #4285f4; color: white;">Pronounce All</button>
        <button id="cbs-choose" style="padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; white-space: nowrap; background: #f1f3f4; color: #5f6368;">Choose</button>
        <button id="cbs-disable-all" style="padding: 10px 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; white-space: nowrap; background: none; color: #5f6368;">Disable All</button>
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

  document.getElementById('cbs-disable-all').addEventListener('click', () => {
    clearTimeout(autoDismissTimer);
    disableTool();
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
  
  const checkboxesHtml = foundNames.map(name => {
    const isEnabled = enabledNames.includes(name);
    const checkboxBg = isEnabled ? '#4285f4' : 'white';
    const checkboxBorder = isEnabled ? '#4285f4' : '#999';
    const checkmarkDisplay = isEnabled ? 'block' : 'none';
    const dataChecked = isEnabled ? 'true' : 'false';
    
    return `
    <label class="cbs-checkbox-label-custom" data-name="${name}" style="display: flex !important; align-items: center !important; padding: 12px !important; border-radius: 8px !important; cursor: pointer !important; transition: background 0.2s !important; gap: 12px !important; margin: 0 !important; font-family: inherit !important; background: transparent !important;">
      <div class="cbs-custom-checkbox" data-checkbox="${name}" data-checked="${dataChecked}" style="width: 18px !important; height: 18px !important; min-width: 18px !important; min-height: 18px !important; border: 2px solid ${checkboxBorder} !important; border-radius: 3px !important; background: ${checkboxBg} !important; cursor: pointer !important; flex-shrink: 0 !important; margin: 0 !important; padding: 0 !important; position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important;">
        <svg style="width: 12px !important; height: 12px !important; display: ${checkmarkDisplay} !important; color: white !important; stroke: white !important;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span style="font-weight: 500 !important; color: #1a1a1a !important; min-width: 100px !important; font-size: 14px !important; font-family: inherit !important; margin: 0 !important;">${name}</span>
      <span style="color: #666 !important; font-size: 14px !important; font-style: italic !important; font-family: inherit !important; margin: 0 !important;">${jsonData[name].pronunciation}</span>
    </label>
  `}).join('');

  menu.innerHTML = `
    <div style="display: flex !important; flex-direction: column !important; height: 100% !important; overflow: hidden !important;">
      <div style="padding: 16px 20px !important; border-bottom: 1px solid #e5e5e5 !important; background: #f8f9fa !important; flex-shrink: 0 !important;">
        <h1 style="margin: 0 0 10px 0 !important; font-size: 18px !important; font-weight: 600 !important; color: #1a1a1a !important; font-family: inherit !important; line-height: 1.4 !important;">Bible Name Aid</h1>
        <div style="display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 12px !important; font-family: inherit !important;">
          <span style="font-size: 12px !important; color: #5f6368 !important; font-weight: 500 !important; font-family: inherit !important;">Extension Enabled</span>
          <label style="position: relative !important; display: inline-block !important; width: 36px !important; height: 20px !important; margin: 0 !important; cursor: pointer !important;">
            <input type="checkbox" id="cbs-menu-global-toggle" checked style="opacity: 0 !important; width: 0 !important; height: 0 !important;">
            <span class="cbs-menu-toggle-slider" style="position: absolute !important; cursor: pointer !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background-color: #4285f4 !important; transition: 0.3s !important; border-radius: 20px !important;"></span>
            <span class="cbs-menu-toggle-knob" style="position: absolute !important; content: '' !important; height: 14px !important; width: 14px !important; left: 3px !important; bottom: 3px !important; background-color: white !important; transition: 0.3s !important; border-radius: 50% !important; transform: translateX(16px) !important;"></span>
          </label>
        </div>
      </div>
      <div style="padding: 16px 20px !important; display: flex !important; flex-direction: column !important; gap: 8px !important; flex-shrink: 0 !important;">
        <button id="cbs-enable-all-btn" style="padding: 14px 24px !important; border: none !important; border-radius: 8px !important; font-size: 15px !important; font-weight: 500 !important; cursor: pointer !important; transition: all 0.2s !important; font-family: inherit !important; white-space: nowrap !important; background: #4285f4 !important; color: white !important; width: 100% !important; margin: 0 !important; line-height: 1.4 !important;">Enable All Pronunciations</button>
        <button id="cbs-disable-all-btn" style="padding: 14px 24px !important; border: none !important; border-radius: 8px !important; font-size: 15px !important; font-weight: 500 !important; cursor: pointer !important; transition: all 0.2s !important; font-family: inherit !important; white-space: nowrap !important; background: #f1f3f4 !important; color: #5f6368 !important; width: 100% !important; margin: 0 !important; line-height: 1.4 !important;">Disable All</button>
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

  document.getElementById('cbs-disable-all-btn').addEventListener('click', () => {
    disableTool();
    hideSelectionMenu();
  });

  // Global toggle handler for selection menu
  const menuGlobalToggle = document.getElementById('cbs-menu-global-toggle');
  const menuToggleSlider = menuGlobalToggle.nextElementSibling;
  const menuToggleKnob = menuToggleSlider.nextElementSibling;
  
  menuGlobalToggle.addEventListener('change', () => {
    isExtensionEnabled = menuGlobalToggle.checked;
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ extensionEnabled: isExtensionEnabled });
    }
    
    // Update toggle appearance
    if (isExtensionEnabled) {
      menuToggleSlider.style.backgroundColor = '#4285f4';
      menuToggleKnob.style.transform = 'translateX(20px)';
    } else {
      menuToggleSlider.style.backgroundColor = '#ccc';
      menuToggleKnob.style.transform = 'translateX(0)';
      // Disable all pronunciations and close menu when turning off
      disableTool();
      hideSelectionMenu();
    }
  });

  document.getElementById('cbs-enable-selected').addEventListener('click', () => {
    const checkedBoxes = menu.querySelectorAll('.cbs-custom-checkbox[data-checked="true"]');
    const selectedNames = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-checkbox'));
    
    // Disable unchecked names that are currently enabled
    const namesToDisable = enabledNames.filter(name => !selectedNames.includes(name));
    if (namesToDisable.length > 0) {
      disableTool(namesToDisable);
    }
    
    // Enable newly checked names
    const namesToEnable = selectedNames.filter(name => !enabledNames.includes(name));
    if (namesToEnable.length > 0) {
      enableTool(jsonData, namesToEnable);
    }
    
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

function disableTool(namesToDisable = null) {
  // If no specific names provided, disable all
  const targetNames = namesToDisable || enabledNames;
  
  if (targetNames.length === 0) return;
  
  console.log('Disabling pronunciations for:', targetNames);
  
  targetNames.forEach(name => {
    const info = jsonData[name];
    if (!info) return;
    
    const pronunciation = info.pronunciation;
    const escapedPronunciation = pronunciation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Find all links with this pronunciation and replace the whole pattern
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node) {
          // Skip our extension elements
          if (node.closest('#chrome-bible-speak-toast') ||
              node.closest('#chrome-bible-speak-selection')) {
            return NodeFilter.FILTER_REJECT;
          }
          // Look for our pronunciation links
          if (node.tagName === 'A' && 
              node.textContent === pronunciation &&
              node.href === info.link) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    const linksToRemove = [];
    let currentNode;
    while (currentNode = walker.nextNode()) {
      linksToRemove.push(currentNode);
    }
    
    linksToRemove.forEach(link => {
      const parent = link.parentNode;
      // Check if preceded by "Name (" and followed by ")"
      const prevSibling = link.previousSibling;
      const nextSibling = link.nextSibling;
      
      if (prevSibling && prevSibling.nodeType === Node.TEXT_NODE &&
          nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
        const prevText = prevSibling.textContent;
        const nextText = nextSibling.textContent;
        
        if (prevText.endsWith(`${name} (`) && nextText.startsWith(')')) {
          // Remove the pattern
          prevSibling.textContent = prevText.slice(0, -2); // Remove " ("
          nextSibling.textContent = nextText.slice(1); // Remove ")"
          link.remove();
        }
      }
    });
  });
  
  // Update global tracker
  if (namesToDisable) {
    enabledNames = enabledNames.filter(n => !namesToDisable.includes(n));
  } else {
    enabledNames = [];
  }
}

function enableTool(data, namesToEnable) {
  console.log('Enabling tool for names:', namesToEnable);
  
  // Filter out names that are already enabled to prevent duplicates
  const newNames = namesToEnable.filter(name => !enabledNames.includes(name));
  
  if (newNames.length === 0) {
    console.log('All selected names already enabled');
    return;
  }
  
  console.log('New names to enable:', newNames);

  // Create a map for quick lookup
  const nameMap = {};
  newNames.forEach(name => {
    nameMap[name] = {
      pronunciation: data[name].pronunciation,
      link: data[name].link
    };
  });

  // Function to process text nodes
  function processTextNode(node) {
    let text = node.textContent;
    let modified = false;
    
    newNames.forEach(name => {
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
  newNames.forEach(name => {
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
  
  // Update global tracker with newly enabled names
  enabledNames = [...enabledNames, ...newNames];
  console.log('Updated enabledNames:', enabledNames);
}

function getBrandingFooter() {
  return `
    <div style="display: flex !important; flex-direction: column !important; gap: 8px !important; font-size: 11px !important; font-family: inherit !important;">
      <span style="color: #666 !important; text-align: center !important; line-height: 1.4 !important; margin: 0 !important; font-family: inherit !important;">An <a href="https://mjt.pub" target="_blank" style="color: #4285f4 !important; text-decoration: none !important; font-family: inherit !important;">mjt.pub</a> project. Questions? Email <a href="mailto:hi@mjt.pub" style="color: #4285f4 !important; text-decoration: none !important; font-family: inherit !important;">hi@mjt.pub</a></span>
      <a href="https://buymeacoffee.com/michaeljthacker" target="_blank" style="display: inline-flex !important; align-items: center !important; gap: 6px !important; padding: 6px 12px !important; background: #FFDD00 !important; color: #000 !important; text-decoration: none !important; border-radius: 6px !important; font-size: 12px !important; font-weight: 500 !important; transition: all 0.2s !important; align-self: center !important; font-family: inherit !important; margin: 0 !important; line-height: 1.4 !important;">
        <svg style="width: 16px !important; height: 16px !important; flex-shrink: 0 !important;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 8C5.45 8 5 8.45 5 9V19C5 20.66 6.34 22 8 22H16C17.66 22 19 20.66 19 19V9C19 8.45 18.55 8 18 8H6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M19 12H21C21.55 12 22 12.45 22 13V15C22 16.1 21.1 17 20 17H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M8 2C8 2 9 3 9 4.5C9 6 8 7 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M12 2C12 2 13 3 13 4.5C13 6 12 7 12 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M16 2C16 2 17 3 17 4.5C17 6 16 7 16 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Buy me a coffee
      </a>
    </div>
  `;
}