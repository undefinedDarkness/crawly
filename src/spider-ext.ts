export const LEVEL_LIMIT = 8;

export function crawl(G: HTMLElement, parent: string, distance: number, crawlID: string) {
    let count = 0;
    for (const e of G.querySelectorAll('a[href^="https"]')) {
      if (count++ > LEVEL_LIMIT) {
        break;
      }
  
      const href = (e as HTMLLinkElement).href;
      // console.log(`Adding new node ${href} from ${parent}`);
      chrome.runtime.sendMessage({
        p: "newNode",
        payload: [href, parent, distance, crawlID],
      });
    }
  }