document.getElementById('enable').addEventListener('click', () => {
  console.log('Enable button clicked');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'enable' });
  });
});

document.getElementById('hide').addEventListener('click', () => {
  console.log('Hide button clicked');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'hide' });
  });
});