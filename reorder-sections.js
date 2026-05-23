(() => {
  const settingKey = "moveMarketOffersToBottom";

  function getMoveEnabled() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({ [settingKey]: true }, (result) => {
        resolve(Boolean(result[settingKey]));
      });
    });
  }

  function findOffersContainer() {
    const offersSection = document.getElementById("offers");
    if (!offersSection) {
      return null;
    }

    const marketMain =
      offersSection.closest('div[role="main"][aria-label="Market offers"]') ||
      offersSection.closest('div[aria-label="Market offers"]');
    if (!marketMain) {
      return null;
    }

    return marketMain.closest("div.transition-all.duration-200") || marketMain.closest("div");
  }

  function liftChildToDirectParent(child, targetParent) {
    let node = child;
    while (node && node.parentNode && node.parentNode !== targetParent) {
      node = node.parentElement;
    }
    if (!node || node.parentNode !== targetParent) {
      return null;
    }
    return node;
  }

  function moveOffersContainerBeforeSimilar() {
    const offers = findOffersContainer();
    const similar = document.getElementById("similar");
    if (!offers || !similar || !similar.parentNode) {
      return false;
    }

    const targetParent = similar.parentNode;
    const moveNode = liftChildToDirectParent(offers, targetParent);
    if (!moveNode || moveNode === similar) {
      return false;
    }

    if (moveNode.nextElementSibling === similar) {
      return true;
    }

    targetParent.insertBefore(moveNode, similar);
    return true;
  }

  async function init() {
    const moveEnabled = await getMoveEnabled();
    if (!moveEnabled) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 480;

    function apply() {
      attempts += 1;
      moveOffersContainerBeforeSimilar();
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        observer.disconnect();
      }
    }

    const observer = new MutationObserver(() => {
      apply();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    const intervalId = setInterval(apply, 250);
    apply();
  }

  init();
})();
