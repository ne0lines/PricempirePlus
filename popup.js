const settingKey = "moveMarketOffersToBottom";

const checkbox = document.getElementById("move-market-offers");
const status = document.getElementById("status");

function showStatus(text) {
  status.textContent = text;
  window.setTimeout(() => {
    if (status.textContent === text) {
      status.textContent = "";
    }
  }, 1000);
}

function loadSetting() {
  chrome.storage.sync.get({ [settingKey]: true }, (result) => {
    checkbox.checked = Boolean(result[settingKey]);
  });
}

checkbox.addEventListener("change", () => {
  chrome.storage.sync.set({ [settingKey]: checkbox.checked }, () => {
    showStatus("Saved");
  });
});

loadSetting();
