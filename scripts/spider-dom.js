var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __require = ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/spider-ext.ts
function crawl(G, parent, distance) {
  let count = 0;
  for (const e of G.querySelectorAll('a[href^="https"]')) {
    if (count++ > LEVEL_LIMIT) {
      break;
    }
    const href = e.href;
    console.log(`Adding new node ${href} from ${parent}`);
    chrome.runtime.sendMessage({
      p: "newNode",
      payload: [href, parent, distance]
    });
  }
}
var LEVEL_LIMIT = 8;

// src/spider-dom.ts
var documentParent = window.location.href ?? document.URL;
console.log(`[\uD83D\uDD77] INJECTED!`);
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.p == "domStartCrawl") {
    console.log(`Starting DOM Crawl!`);
    crawl(document.body, documentParent, 1);
  }
});
