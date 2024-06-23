import { crawlLinksInPage } from './spider-ext.js'
import { MessageTypes } from "./messages";
const documentParent = window.location.href ?? document.URL
console.log(`[🕷] INJECTED!`)

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.p == MessageTypes.DOM_START_CRAWL) {
        console.log(`Starting DOM Crawl!`)
        crawlLinksInPage(document.body, documentParent, 1, msg.payload)
    }
})