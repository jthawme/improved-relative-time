import { writeFile, mkdir } from "node:fs/promises";
import * as path from "node:path";
import { JSDOM } from "jsdom";
import { rawDataFile, dataFolder } from "./utils.js";

/**
 * Correct as of December 2024, but of course if wikipedia pages, this will break
 *
 * I split the page into sections by utilising the H3 headings, there are nicer H4s, but the
 * larger epochs dont get split in that same granular way, so I crawl through the page after each
 * H3 to determine what to get and not
 */

const getPage = async () => {
  const text = await fetch(
    "https://en.wikipedia.org/wiki/Timeline_of_historic_inventions"
  ).then((resp) => resp.text());

  return new JSDOM(text);
};

/**
 * The rules to determine if the scraping/trawling through the dom should
 * terminate because it has come up against a heading or section ender
 *
 * @param {Element | null} node
 */
const shouldTerminateListScrape = (node) => {
  if (!node) {
    return true;
  }

  // We are at the next h3 section. I could just run through these
  // But it felt better to compartmentalise
  if (node.tagName === "h3" || node.querySelector("h3") !== null) {
    return true;
  }

  // We are at the bottom of the page
  if (node.querySelector("h2")?.id === "See_also") {
    return true;
  }

  return false;
};

/**
 *
 * @param {string} str
 * @returns {number[]}
 */
const extractNumbers = (str) =>
  str.match(/[\d,]+(\.\d+)?/g).map((num) => parseFloat(num));

/**
 *
 * @param {string} lctime
 * @param {number} [modifier]
 */
const centuryProtect = (lctime, modifier = -1) => {
  if (lctime.includes("century") || lctime.includes("millenium")) {
    const [century] = extractNumbers(lctime);

    return (century + (lctime.includes("late") ? 0 : modifier)) * 1000;
  }

  const [firstTime] = extractNumbers(lctime);

  // Add the base of unix time to it, before inverting
  return firstTime;
};

/**
 *
 * @param {string} time
 */
const convertTimeToYear = (time) => {
  const lctime = time.toLowerCase();

  if (lctime.includes("mya:")) {
    const [firstTime] = extractNumbers(lctime);

    return firstTime * -1000000;
  }

  if (lctime.includes("kya:")) {
    const [firstTime] = extractNumbers(lctime);

    return firstTime * -1000;
  }

  if (lctime.includes("bc:")) {
    return centuryProtect(lctime, 1) * -1;
  }

  if (lctime.includes("ad:")) {
    return centuryProtect(lctime);
  }

  const [year] = extractNumbers(lctime);

  return year;
};

/**
 *
 * @param {HTMLLIElement} listItem
 */
const extractPossibleEvents = (listItem) => {
  return {
    fullText: listItem.textContent,
    items: [...listItem.querySelectorAll("a")]
      .filter((item) => item.href.startsWith("/"))
      .map((item) => ({
        text: item.textContent,
        link: item.href,
      })),
  };
};

/**
 *
 * @param {HTMLLIElement} listItem
 */
const breakdownListItem = (listItem) => {
  // console.log(listItem);
  const time = listItem.querySelector("b")?.textContent;

  if (!time) {
    return null;
  }

  const year = convertTimeToYear(time);
  const events = extractPossibleEvents(listItem);

  console.log(time);

  return {
    time,
    year,
    events,
  };
};

/**
 *
 * @param {HTMLUListElement} list
 */
const getList = (list) => {
  return [...list.querySelectorAll(":scope > li")]
    .map(breakdownListItem)
    .filter((item) => !!item);
};

/**
 *
 * @param {JSDOM} dom
 */
const getLists = async (dom) => {
  const headingPoints = [...dom.window.document.querySelectorAll("h3")];

  return headingPoints.flatMap((heading) => {
    let nextSibling = heading.parentElement.nextElementSibling;

    const items = [];

    while (!shouldTerminateListScrape(nextSibling)) {
      if (nextSibling.tagName === "UL") {
        items.push(...getList(nextSibling));
      }

      nextSibling = nextSibling.nextElementSibling;
    }

    return items;
  });
};

console.log("Fetching wikipedia page");
const dom = await getPage();

console.log("Compartmentalising page and breaking down information");
const items = await getLists(dom);

console.log("Creating data folder");
await mkdir(dataFolder, { recursive: true });

console.log("Saving scraped data");
await writeFile(rawDataFile, JSON.stringify(items, null, 2), "utf-8");
