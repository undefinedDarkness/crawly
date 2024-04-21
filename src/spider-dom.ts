import { crawl } from './spider-ext.js'

const documentParent = window.location.href ?? document.URL
console.log(`[🕷] INJECTED!`)

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.p == 'domStartCrawl') {
        console.log(`Starting DOM Crawl!`)
        crawl(document.body, documentParent, 1, msg.payload)
    }
})