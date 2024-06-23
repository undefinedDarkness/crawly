import cytoscape from "cytoscape";
import { nanoid } from "nanoid";
import { MessageTypes } from "./messages";

export async function historyCrawl(crawlID: string) {
  const completeHistory = await chrome.history.search({
    text: "",
    startTime: 0,
  });

  const map = new Map();
  for (const item of completeHistory) {
    map.set(item.id, item);
  }

  const cy = cytoscape({
    headless: true,
  });

  const stack = [completeHistory[0]];
  {
    const item = stack[0];
    cy.add({
      group: "nodes",
      data: {
        id: item.id,
        hostname: item.url,
      },
      classes: "domain",
    });
  }
  while (stack.length > 0) {
    const item = stack.pop()!;
    if (!item || !item.url) {
      continue;
    }

    const visits = await chrome.history.getVisits({ url: item.url! });
    for (const visit of visits) {
      if (!map.has(visit.id)) {
        continue;
      }

      const v = map.get(visit.id)!;
      stack.push(v);

      cy.add({
        group: "nodes",
        data: {
          id: v.id,
          hostname: v.url,
        },
        classes: "domain",
      });

      cy.add({
        group: "edges",
        data: {
          id: nanoid(),
          source: item.id,
          target: v.id,
        },
      });
    }
  }
}
