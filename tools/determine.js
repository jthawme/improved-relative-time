import { select, input, Separator } from "@inquirer/prompts";
import { readFile, writeFile } from "node:fs/promises";
import colors from "yoctocolors";
import slugify from "slugify";

import {
  rawDataFile,
  determinedDataFile,
  promiseRunner,
  onExit,
  readJsonFile,
} from "./utils.js";
import { writeFileSync } from "node:fs";

const getPreviousData = async () => {
  try {
    return readJsonFile(determinedDataFile);
  } catch {
    return [];
  }
};

const LEVEL = {
  SLIM: "slim",
  DESCRIPTIVE: "descriptive",
  VERBOSE: "verbose",
};

/**
 * This file is manual, in which I set the determination on what the actual innovation of that timeframe was
 */

/**
 * @typedef {object} RawItem
 * @property {string} time
 * @property {number} year
 * @property {{items: {text: string, link: string}[], fullText: string}} events
 */

/**
 *
 * @param {string} text
 * @returns
 */
const slug = (text) => slugify(text, { remove: /[*+~.()'"!:@]/g, lower: true });

/**
 *
 * @param {RawItem} item
 */
const determineTopic = async (item) => {
  const optionIndex = await select({
    message: "Choose Topic",
    choices: [
      ...item.events.items.map((i, idx) => ({
        name: i.text,
        value: idx,
      })),
      new Separator(),
      {
        name: "Other",
        value: -1,
        description: "Manually enter",
      },
    ],
  });

  if (optionIndex >= 0) {
    return item.events.items[optionIndex];
  }

  const manualInput = await input({ message: "Type:" });

  const manualOptionIndex = await select({
    message: "Choose linked topic",
    choices: [
      ...item.events.items.map((i, idx) => ({
        name: i.text,
        value: idx,
      })),
      new Separator(),
      {
        name: "Manual",
        value: -1,
        description: "Manually enter",
      },
    ],
  });

  if (manualOptionIndex >= 0) {
    return {
      ...item.events.items[manualOptionIndex],
      text: manualInput,
    };
  }

  const manualLink = await input({ message: "Wiki Link:" });

  return {
    link: ["/wiki", manualLink.split("/wiki/")[1]].join("/"),
    text: manualInput,
  };
};

/**
 *
 * @param {string} word
 */
const determineSlimCharacter = (word) => {
  if (word.toUpperCase() === word) {
    return word;
  }

  return word
    .match(/(\b[A-Za-z]|[A-Z])[a-z]*/g)
    .map((w) => {
      const lcword = w.toLowerCase();

      if (lcword === "of" || lcword === "in" || lcword === "the") {
        return "";
      }

      return w.charAt(0).toUpperCase();
    })
    .join("");
};

/**
 *
 * @param {string} word
 * @param {number} idx
 */
const determineDescriptiveCharacter = (word, idx) => {
  if (word.toUpperCase() === word) {
    return word;
  }

  return word
    .match(/(\b[A-Za-z]|[A-Z])[a-z]*/g)
    .map((w, widx) => {
      const lcword = w.toLowerCase();

      if (lcword === "of" || lcword === "in" || lcword === "the") {
        return lcword.charAt(0);
      }

      if (idx === 0 && widx === 0) {
        return w.charAt(0).toUpperCase() + w.charAt(1).toLowerCase();
      }
      return w.charAt(0).toUpperCase();
    })
    .join("");
};

/**
 *
 * @param {string} word
 * @param {number} idx
 */
const determineVerboseCharacter = (word, idx) => {
  if (word.toUpperCase() === word) {
    return word;
  }

  return word
    .match(/(\b[A-Za-z]|[A-Z])[a-z]*/g)
    .map((w) => {
      const lcword = w.toLowerCase();

      if (lcword === "of" || lcword === "in" || lcword === "the") {
        return lcword.charAt(0);
      }

      return w.charAt(0).toUpperCase() + w.charAt(1).toLowerCase();
    })
    .join("");
};

/**
 *
 * @param {string} text
 */
const determineAbbreviation = (text) => {
  const parts = text
    .split(/\W+/)
    .map((word, idx) => {
      return {
        [LEVEL.SLIM]: determineSlimCharacter(word, idx),
        [LEVEL.DESCRIPTIVE]: determineDescriptiveCharacter(word, idx),
        [LEVEL.VERBOSE]: determineVerboseCharacter(word, idx),
      };
    })
    .reduce(
      (dict, curr) => ({
        [LEVEL.SLIM]: [...dict[LEVEL.SLIM], curr[LEVEL.SLIM]],
        [LEVEL.DESCRIPTIVE]: [
          ...dict[LEVEL.DESCRIPTIVE],
          curr[LEVEL.DESCRIPTIVE],
        ],
        [LEVEL.VERBOSE]: [...dict[LEVEL.VERBOSE], curr[LEVEL.VERBOSE]],
      }),
      {
        [LEVEL.SLIM]: [],
        [LEVEL.DESCRIPTIVE]: [],
        [LEVEL.VERBOSE]: [],
      }
    );

  return {
    [LEVEL.SLIM]: parts[LEVEL.SLIM].join(""),
    [LEVEL.DESCRIPTIVE]: parts[LEVEL.DESCRIPTIVE].join(""),
    [LEVEL.VERBOSE]: parts[LEVEL.VERBOSE].join(""),
  };
};

/**
 *
 * @param {RawItem} item
 */
const questionItem = async (item) => {
  console.log(colors.blueBright("Topic:"));
  console.log(item.events.fullText, "\n\n");

  const linked = await determineTopic(item);

  const abbreviation = determineAbbreviation(linked.text);

  return {
    id: slug(linked.text),

    year: item.year,
    linked,
    abbreviation,
  };
};

const uniqueItems = (arr) => {
  const seen = new Set();
  return arr.filter((item) => !seen.has(item.id) && seen.add(item.id));
};

const cumulativeData = await getPreviousData();

onExit(() => {
  console.log("DEATH");
  writeFileSync(
    determinedDataFile,
    JSON.stringify(uniqueItems(cumulativeData), null, 2)
  );
});

const rawJsonData = await readJsonFile(rawDataFile);

/**
 * This is the annoying part, its a moving target, but i dont want to repeat the manual process if possible
 * so we try determine a 'confflict property' a property to check against and see if we've seen this before
 * but likely if the wiki gets updated this will invalidate somewhat, so we just have to hope
 *
 * @param {RawItem}
 */
function createConflictProperty(item) {
  try {
    const suffixes =
      item.events.items.length === 0
        ? [slug(item.events.fullText)]
        : item.events.items.map((i) => slug(i.text));

    return [item.year, ...suffixes].join("-");
  } catch (e) {
    console.log(item);
    throw e;
  }
}

function addItemToCumulative(item, rawItem) {
  const idx = cumulativeData.findIndex((i) => i.id === item.id);

  if (idx >= 0) {
    cumulativeData.splice(idx, 1, {
      ...item,
      conflictProperty: createConflictProperty(rawItem),
    });
  } else {
    cumulativeData.push({
      ...item,
      conflictProperty: createConflictProperty(rawItem),
    });
  }
}

await promiseRunner(rawJsonData, async (item, idx) => {
  const prev = cumulativeData.find(
    // (d) => d.conflictProperty === createConflictProperty(item)
    (d) => {
      if (d.conflictProperty === `${item.year}-${idx}`) {
        console.log("item-year-idx");
        return true;
      }

      if (Array.isArray(d.conflictProperty)) {
        console.log("legacy array");
        return true;
      }

      if (d.conflictProperty === createConflictProperty(item)) {
        console.log("conflict property new");
        return true;
      }
    }
  );

  // if (item.events.fullText.includes("watch")) {
  //   console.log(item);
  // }

  if (!!prev) {
    console.log(colors.yellow("Skipping:"), prev.linked.text);
    return;
  }

  const determined = await questionItem(item);

  addItemToCumulative(determined, item);
});
