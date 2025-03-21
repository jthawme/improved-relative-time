import { fileURLToPath } from "node:url";
import * as path from "node:path";
import { readFile } from "node:fs/promises";

export const __dirname = fileURLToPath(new URL(".", import.meta.url));

export const dataFolder = path.resolve(__dirname, "..", "data");
export const libFolder = path.resolve(__dirname, "..", "lib");

export const rawDataFile = path.resolve(dataFolder, "scraped-data.json");
export const determinedDataFile = path.resolve(
  dataFolder,
  "determined-data.json"
);
export const splitExportFile = path.resolve(libFolder, "data.js");
export const mergeFile = path.resolve(libFolder, "merge.js.txt");

/**
 *
 * @param {T[]} arr
 * @param {(item: T, idx: number, arr: T[], responses: any[]) => Promise<any>} cb
 * @template T
 */
export const promiseRunner = (arr, cb) => {
  return new Promise((resolve) => {
    const responses = [];

    const run = async (idx = 0) => {
      if (idx >= arr.length) {
        resolve(responses);
        return;
      }

      responses.push(await cb(arr[idx], idx, arr, responses));
      run(idx + 1);
    };

    run();
  });
};

export const onExit = (cb) => {
  // do something when app is closing
  process.on("exit", cb.bind(null, { cleanup: true }));

  // catches ctrl+c event
  process.on("SIGINT", cb.bind(null, { exit: true }));

  // catches "kill pid" (for example: nodemon restart)
  process.on("SIGUSR1", cb.bind(null, { exit: true }));
  process.on("SIGUSR2", cb.bind(null, { exit: true }));

  // catches uncaught exceptions
  process.on("uncaughtException", (evt) => {
    cb.bind(null, { exit: true });
    console.error(evt);
  });
};

/**
 *
 * @param {string} filePath
 */
export const readJsonFile = async (filePath) => {
  const raw = await readFile(filePath, "utf-8");

  return JSON.parse(raw);
};
