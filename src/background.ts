import { getCurrentTab, sendToContentScript } from "./util.js";
import { parseHTML } from "linkedom";
import { MessageTypes } from "./messages";
import { crawlLinksInPage } from "./spider-ext.js";
import { historyCrawl } from "./history.js";
// import $ from "jquery";
console.log(`Background script injected!`);

// const bgDocument = chrome.extension.getBackgroundPage()?.document!;


let bytesCrawled = 0
chrome.runtime.onMessage.addListener(async (req, sender, sendResponse) => {
  const { p, payload } = req;
  if (p == MessageTypes.INJECT_CONTENT_SCRIPT_INTO_PAGE) {
    // return;
    const tab = await chrome.tabs.get(parseInt(payload)) // sender.tab!;
    console.log(`Attempting to inject content script into ${tab.url}`);
    const tabId = tab.id!;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["scripts/spider-dom.js"],
    });
  } else if (p == MessageTypes.WANT_CRAWL_OF_PAGE) {
    console.log(`[🕷] Crawling ${payload[0]}`);
    try {
      const req = await fetch(payload[0]);
      const resp = await req.text();
      bytesCrawled += resp.length
      crawlLinksInPage(parseHTML(resp).document.body, payload[0], payload[1], payload[2]);
    } catch (err) {
      // console.info(`Failed: ${err}`);
    }
  } else if (p == MessageTypes.WANT_BYTES_CRAWLED) {
    await sendResponse(bytesCrawled);
  } else if (p == MessageTypes.HISTORY_START_CRAWL) {
    
    historyCrawl(payload)

  }
});

chrome.action.onClicked.addListener(async function (tab) {
  // Your logic to open the popup in a new window goes here
  // For instance, create a new window using chrome.windows.create
  const currentActiveTab = await getCurrentTab()
  const url = new URL(chrome.runtime.getURL('pages/ui.html'));
  url.searchParams.set('lastActiveTabId', currentActiveTab.id?.toFixed(0)!);
  url.searchParams.set('lastActiveTabUrl', currentActiveTab.url!);
  url.searchParams.set('source', 'crawlCurrentSite')
  const window = await chrome.windows.create({
    url: url.href,
    type: "popup",
  })
});
