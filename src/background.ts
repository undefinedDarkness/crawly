import { getCurrentTab, sendToContentScript } from "./util.js";
import { parseHTML } from "linkedom";
import { crawl } from "./spider-ext.js";
// import $ from "jquery";
console.log(`Background script injected!`);

// const bgDocument = chrome.extension.getBackgroundPage()?.document!;


let bytesCrawled = 0
chrome.runtime.onMessage.addListener(async (req, sender, sendResponse) => {
  const { p, payload } = req;
  if (p == "injectContentScript") {
    // return;
    const tab = await chrome.tabs.get(parseInt(payload)) // sender.tab!;
    console.log(`Attempting to inject content script into ${tab.url}`);
    const tabId = tab.id!;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["scripts/spider-dom.js"],
    });
  } else if (p == "requestCrawl") {
    console.log(`[🕷] Crawling ${payload[0]}`);
    try {
      const req = await fetch(payload[0]);
      const resp = await req.text();
      bytesCrawled += resp.length
      crawl(parseHTML(resp).document.body, payload[0], payload[1], payload[2]);
    } catch (err) {
      // console.info(`Failed: ${err}`);
    }
  } else if (p == "bytesCrawled") {
    await sendResponse(bytesCrawled);
  }
});

chrome.action.onClicked.addListener(async function (tab) {
  // Your logic to open the popup in a new window goes here
  // For instance, create a new window using chrome.windows.create
  const currentActiveTab = await getCurrentTab()
  const window = await chrome.windows.create({
    url: `${chrome.runtime.getURL('pages/ui.html')}?lastActiveTabId=${currentActiveTab.id!}`,
    type: "popup",
  })
});
