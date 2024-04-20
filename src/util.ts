export async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

export function sendToContentScript(d: unknown, tabid: number | undefined, resp = () => {}) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabid ?? tabs[0].id!, d, resp);
  });
}
