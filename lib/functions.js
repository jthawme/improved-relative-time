import * as Data from "./data.js";

const iterationTable = {
  [0]: "⁰",
  [1]: "¹",
  [2]: "²",
  [3]: "³",
  [4]: "⁴",
  [5]: "⁵",
  [6]: "⁶",
  [7]: "⁷",
  [8]: "⁸",
  [9]: "⁹",
};

/**
 *
 * @param {number} num
 * @param {boolean} truncate
 * @returns {string}
 */
const conditionalTruncate = (num, truncate) => {
  if (!truncate) {
    return num.toString();
  }

  if (num > 1000000) {
    return `${Math.round(num / 100000) / 10}m`;
  }

  if (num > 1000) {
    return `${Math.round(num / 100) / 10}k`;
  }

  return num.toString();
};

/**
 *
 * @param {number | Date} time
 * @param {keyof Data | import('./types.js').ImprovedRelativeTimeItem} relativeTimeIdOrItem
 * @param {import('./types.js').ImprovedRelativeTimeFormatOptions} options
 */
export const formatTime = (time, relativeTimeIdOrItem, options = {}) => {
  const {
    level = "slim",
    displayIteration = false,
    returnObject = false,
    truncateNumbers = false,
  } = options;
  const _d = typeof time === "number" ? new Date(time) : time;
  const _r =
    typeof relativeTimeIdOrItem === "string"
      ? Data[relativeTimeIdOrItem]
      : relativeTimeIdOrItem;

  if (!_r) {
    return "UNKNOWN TIME";
  }

  const yearDifference =
    (typeof _r.year === "number" ? _r.year : _r.year()) - _d.getFullYear();

  const formatted = (() => {
    switch (level) {
      case "slim":
      case "descriptive":
      case "verbose": {
        const value = Math.abs(yearDifference);
        const prefix = conditionalTruncate(
          Math.abs(yearDifference),
          truncateNumbers
        );
        const suffix = [
          yearDifference > 0 ? "B" : "A",
          level === "slim" && displayIteration
            ? iterationTable[_r.iteration]
            : "",
          _r[level],
        ].join("");

        return {
          value,
          combined: [prefix, suffix].join(""),
          prefix,
          suffix,
        };
      }
      case "sentence": {
        const value = Math.abs(yearDifference);
        const prefix = conditionalTruncate(
          Math.abs(yearDifference),
          truncateNumbers
        );
        const suffix = [yearDifference > 0 ? "before" : "after", _r.text].join(
          " "
        );

        return {
          value,
          combined: [prefix, "years", suffix].join(" "),
          prefix,
          suffix,
        };
      }
    }
  })();

  return returnObject
    ? {
        formatted,
        item: _r,
      }
    : formatted.combined;
};

/**
 *
 * @param {number | Date} time
 * @param {import('./types.js').ImprovedRelativeTimeFormatOptions} options
 */
export const formatTimeRandom = (time, options = {}) => {
  const keys = Object.keys(Data);

  return formatTime(
    time,
    keys[Math.floor(Math.random() * keys.length)],
    options
  );
};
