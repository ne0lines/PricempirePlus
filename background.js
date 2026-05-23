// Create a context menu item that appears when text is selected
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "search-pricempire",
    title: "Search Pricempire for '%s'",
    contexts: ["selection"]
  });
});

// When the context menu item is clicked, open a new tab with the search URL
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "search-pricempire" && info.selectionText) {
    const query = encodeURIComponent(info.selectionText.trim());
    const url = `https://pricempire.com/cs2-skin-search?q=${query}`;
    chrome.tabs.create({ url });
  }
});
