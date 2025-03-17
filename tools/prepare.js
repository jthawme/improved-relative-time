import { readFile, writeFile } from "node:fs/promises";
import {
  determinedDataFile,
  mergeFile,
  readJsonFile,
  splitExportFile,
} from "./utils.js";

const data = await readJsonFile(determinedDataFile);

/**
 *
 * @param {string} str
 */
const camelSlug = (str) => {
  return str
    .split("-")
    .map((word) =>
      `${word.charAt(0).toUpperCase()}${word.slice(1)}`.replaceAll(/'/g, "")
    )
    .join("");
};

const prepared = data
  .map((item, idx, arr) => {
    const duplicates = arr.filter(
      (compare) => compare.abbreviation.slim === item.abbreviation.slim
    );
    const duplicateIds = arr.filter((compare) => compare.id === item.id);

    return {
      ...item,
      iteration:
        duplicates.length > 0
          ? duplicates
              .map((compare) => compare.conflictProperty)
              .indexOf(item.conflictProperty) + 1
          : 0,
      id: `${item.id}${
        duplicateIds.length > 1
          ? duplicateIds.findIndex(
              (compare) => compare.conflictProperty === item.conflictProperty
            )
          : ""
      }`,
    };
  })
  .map((item) => {
    return {
      id: item.id,
      text: item.linked.text,
      source: ["https://en.wikipedia.org", item.linked.link].join(""),
      slim: item.abbreviation.slim,
      descriptive: item.abbreviation.descriptive,
      verbose: item.abbreviation.verbose,
      year: item.year,
      iteration: item.iteration,
    };
  })
  .reduce((dict, curr) => {
    return {
      ...dict,
      [camelSlug(curr.id)]: curr,
    };
  }, {});

const mergeText = await readFile(mergeFile, "utf-8");

await writeFile(
  splitExportFile,
  `
  ${Object.entries(prepared)
    .map(([id, item]) => {
      return `export const ${id} = ${JSON.stringify(item, null, 2)}`;
    })
    .join("\n\n")}

  ${mergeText.split("{{NOW}}").join(new Date().getFullYear())}
  `,
  "utf-8"
);
