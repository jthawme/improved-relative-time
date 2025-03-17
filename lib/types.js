/**
 * @typedef {object} ImprovedRelativeTimeItem
 * @property {string} id
 * @property {string} text The actual linked text of the invention
 * @property {string} source A link back to the relevant wikipedia page
 * @property {string} slim Abbreviation
 * @property {string} descriptive A more descriptive abbreviation
 * @property {string} verbose The fullest version of the abbreviations
 * @property {number} year The year to compare against
 * @property {number} iteration The iteration on a conflict of the slim property - for superscripts if needed
 */

/**
 * @typedef {object} ImprovedRelativeTimeFormatOptions
 * @property {'slim' | 'descriptive' | 'verbose' | 'sentence'} [level]
 * @property {boolean} [displayIteration]
 * @property {boolean} [returnObject]
 * @property {boolean} [truncateNumbers]
 */

export const Types = {};
