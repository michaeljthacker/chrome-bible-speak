// content.js
console.log('Chrome Bible Speak content script loaded.');

fetch(chrome.runtime.getURL('names_pronunciations.json'))
  .then(response => response.json())
  .then(data => {
    console.log('JSON data loaded:', data); // Debugging log
    const names = Object.keys(data);
    const bodyText = document.body.innerText;

    let menuAppended = false;

    names.forEach(name => {
      if (bodyText.includes(name)) {
        console.log(`Found name: ${name}`); // Debugging log

        if (!menuAppended) {
          // Add logic to display the toggle/menu
          const menu = document.createElement('div');
          menu.id = 'chrome-bible-speak-menu';
          menu.style.position = 'fixed';
          menu.style.top = '10px';
          menu.style.right = '10px';
          menu.style.backgroundColor = 'white';
          menu.style.border = '1px solid black';
          menu.style.padding = '10px';
          menu.style.zIndex = '1000';
          menu.style.textAlign = 'center'; // Center the content
          menu.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">BibleSpeak Pronunciations</div>
            <button id="enable" style="display: block; margin: 5px auto;">Enable</button>
            <button id="hide" style="display: block; margin: 5px auto;">Hide</button>
          `;
          document.body.appendChild(menu);
          console.log('Menu appended to document body'); // Debugging log

          // Add event listeners for the buttons
          document.getElementById('enable').addEventListener('click', () => {
            console.log('Enable button clicked'); // Debugging log
            enableTool(data);
            hideMenu(); // Hide the menu after enabling the tool
          });
          document.getElementById('hide').addEventListener('click', () => {
            console.log('Hide button clicked'); // Debugging log
            hideMenu();
          });

          menuAppended = true;
        }
      }
    });
  })
  .catch(error => console.error('Error loading JSON:', error));

function enableTool(data) {
  console.log('Enabling tool with data:', data); // Debugging log
  const names = Object.keys(data);

  names.forEach(name => {
    const pronunciation = data[name].pronunciation;
    const link = data[name].link;
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    if (document.body.innerHTML.includes(name)) {
      console.log(`Replacing ${name} with ${name} (<a href="${link}" target="_blank">${pronunciation}</a>)`); // Debugging log
      document.body.innerHTML = document.body.innerHTML.replace(regex, `${name} (<a href="${link}" target="_blank">${pronunciation}</a>)`);
    }
  });
}

function hideMenu() {
  console.log('Hiding menu'); // Debugging log
  const menu = document.getElementById('chrome-bible-speak-menu');
  if (menu) {
    menu.style.display = 'none';
  }
}