import cytoscape from "cytoscape";

// @ts-ignore
import cola from "cytoscape-cola";
// @ts-ignore
import spread from "cytoscape-spread";

import { nanoid } from "nanoid";
import { LEVEL_LIMIT } from "./spider-ext.js";
import { sendToContentScript } from "./util.js";

let TOTAL_NODE_LIMIT = 101;
let ranEnd = false;

if (TOTAL_NODE_LIMIT <= 100) {
  alert(`Low number of total nodes! (<= 100)`);
}

spread(cytoscape);
cytoscape.use(cola as cytoscape.Ext);

const $ = (_: string) => document.querySelector(_)!;
const $$ = (_: string) => document.querySelectorAll(_)!;

// Inject Content Script

const target_tabid = parseInt(
  new URL(window.location.href ?? document.URL)
    .searchParams.get("lastActiveTabId")!,
);
console.log(`Injecting into tabid ${target_tabid}`);
chrome.runtime.sendMessage({
  p: "injectContentScript",
  payload: target_tabid,
});

// Prepare Graph
const graph_el: HTMLElement = document.querySelector("#graph")!;
const cy = cytoscape({
  container: graph_el, // container to render in
  elements: [],
  style: [
    {
      selector: "node.domain",
      style: {
        "background-color": "red",
        "label": "data(hostname)",
      },
    },
  ],
});

const refit = () => {
  cy.layout({ name: "cola" }).run();
  cy.fit();
};

const setupUI = () => {
  cy.on("resize", refit);
  $("#refit-graph").addEventListener("click", refit);

  cy.on("zoom", (_evt) => {
    //@ts-ignore
    ($("#zoom-input") as HTMLInputElement).value = cy.zoom();
    $("#zoom-value").textContent = cy.zoom().toLocaleString();
  });

  cy.on("add", () => {
    $("#node-count").textContent = cy.nodes().length.toLocaleString();
  });

  cy.on("click", "node", function (_evt) {
    //@ts-ignore
    const node = _evt.target as cytoscape.NodeSingular;
    chrome.tabs.create({
      url: node.id(),
    });
  });

  $("#zoom-input").addEventListener("input", (e) => {
    const v = Number((e.target as HTMLInputElement).value);
    cy.zoom(v);
  });

  cy.fit();

  ($("#total-nodes") as HTMLInputElement).value = TOTAL_NODE_LIMIT.toFixed(0);
  $("#total-nodes").addEventListener("input", (e) => {
    TOTAL_NODE_LIMIT = Number((e.target as HTMLInputElement).value);
    ranEnd = false;
  });

  $("#regenerate").addEventListener("click", () => {
    cy.nodes().remove();
    cy.edges().remove();
    chrome.tabs.sendMessage(target_tabid, { p: "domStartCrawl" });
  });
};

const domains = new Set();
const bannedDomains = ["google.com", "twitter.com", "facebook.com"];
const insertHasURL = (hs: string) => {
  if (domains.has(hs)) return false;
  else {
    domains.add(hs);
    return true;
  }
};

let deepestLevel = 0;

const afterReachingLimit = () => {
  if (ranEnd) return;
  ranEnd = true;
  cy.nodes().forEach((node) => {
    const node_color = `hsl(${
      (100 * node.data("distance") / deepestLevel).toFixed(0)
    }, 100%, 50%)`;
    node.style("background-color", node_color);
  });
  console.log(`--- FINISHED ---`);
  refit();
};

// @ts-ignore
window["afterReachingLimit"] = afterReachingLimit;

function handleMessage(msg: { p: string; payload: any }) {
  const { p, payload } = msg;
  console.log(`Got newNode request!`);
  if (p == "newNode") {
    if (cy.nodes().length >= TOTAL_NODE_LIMIT) {
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
chrome.tabs.sendMessage(target_tabid, { p: "domStartCrawl" });
