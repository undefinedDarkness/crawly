import { getCurrentTab, sendToContentScript } from "./util.js";
import { parseHTML } from "linkedom";
import { crawl } from "./spider-ext.js";
import { nanoid } from "nanoid";
console.log(`Background script injected!`);

// const bgDocument = chrome.extension.getBackgroundPage()?.document!;
let deepestLevel = 0;
const domains = new Set();

const TOTAL_NODE_LIMIT = 101

const insertHasURL = (hs: string) => {
  if (domains.has(hs)) return false;
  else {
    domains.add(hs);
    return true;
  }
};


const bannedDomains = ["google.com", "twitter.com", "facebook.com"]
let nodeCount = 0

function handleMessage(msg: { p: string; payload: any }) {
  const { p, payload } = msg;
  console.log(`Got newNode request!`);
  if (p == "newNode") {
    if (nodeCount >= TOTAL_NODE_LIMIT) {
      afterReachingLimit();
      return;
    }
    const [url, parent, distance] = payload;
    deepestLevel = distance > deepestLevel ? distance : deepestLevel;

    if (cy.$id(parent).empty()) {
      const parent_hostname = new URL(parent).hostname;

      cy.add({
        data: { id: parent, hostname: parent_hostname, distance },
        classes: insertHasURL(parent_hostname) ? "domain" : "",
      });
    }
    const url_hostname = new URL(url).hostname;
    if (insertHasURL(url_hostname)) {
      cy.add({
        data: { id: url, hostname: url_hostname, distance: distance },
        classes: "domain",
      });

      if (!bannedDomains.some((t) => url_hostname.includes(t))) {
        console.log(`Requesting crawingling of ${url}`);
        chrome.runtime.sendMessage({
          p: "requestCrawl",
          payload: [url, distance + 1],
        });
      }
    } else {
      return;
      cy.add({
        data: { id: url, hostname: url_hostname, distance: distance },
      });
    }

    if (parent != url) {
      cy.add({
        data: { id: nanoid(), source: parent, target: url },
        group: "edges",
      });
    }
  }
}

// sendToContentScript({ p: 'domStartCrawl' }, target_tabid)
chrome.runtime.onMessage.addListener((msg, sender, resp) => {
  try {
    handleMessage(msg);
  } catch (err) {
    // console.error(err)
  }
});

chrome.runtime.onMessage.addListener(async (req, sender, sendResponse) => {
  const { p, payload } = req;
  handleMessage(req)
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

      crawl(parseHTML(resp).document.body, payload[0], payload[1]);
      // TODO: Look into using linkedom/worker, seems perfect!
      // sendToContentScript({
      //   p: 'parseHTMLAndFinishCrawl',
      //   payload: [ resp, payload ]
      // })
    } catch (err) {
      // console.info(`Failed: ${err}`);
    }
  }
});

chrome.action.onClicked.addListener(async function (tab) {
  // Your logic to open the popup in a new window goes here
  // For instance, create a new window using chrome.windows.create
  const currentActiveTab = await getCurrentTab()
  chrome.windows.create({
    url: `${chrome.runtime.getURL('pages/ui.html')}?lastActiveTabId=${currentActiveTab.id!}`,
    type: "popup",
  });
});
