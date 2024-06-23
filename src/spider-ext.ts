import { MessageTypes } from "./messages";

export const LEVEL_LIMIT = 100;

export function crawlLinksInPage(G: HTMLElement, parent: string, distance: number, crawlID: string) {
    let count = 0;
    for (const e of G.querySelectorAll('a[href^="https"]')) {
      if (count++ > LEVEL_LIMIT) {
        break;
      }
  
      const href = (e as HTMLLinkElement).href;
      // console.log(`Adding new node ${href} from ${parent}`);
      chrome.runtime.sendMessage({
        p: MessageTypes.CREATE_NEW_NODE_WITH_PARENT_V1,
        payload: [href, parent, distance, crawlID],
      });
    }
  }