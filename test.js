import {
  formatTime,
  formatTimeRandom,
} from "./dist/improved-relative-time.es.js";

console.log("1:", formatTime(new Date("2021-01-01"), "Iphone"));
console.log(
  "2:",
  formatTime(new Date("2021-01-01"), "Airplane", { level: "descriptive" })
);
console.log(
  "3:",
  formatTime(new Date("2021-01-01"), "Google", { level: "verbose" })
);
console.log(
  "3a:",
  formatTime(new Date("2021-01-01"), "Google", {
    level: "slim",
    displayIteration: true,
  })
);
console.log(
  "4:",
  formatTime(new Date("2021-01-01"), "XRay", { level: "sentence" })
);
console.log("5:", formatTimeRandom(new Date("2021-01-01")));

const d = new Date();
d.setFullYear(100);
console.log("5:", formatTimeRandom(d, { level: "sentence" }));
console.log("6:", formatTime(d, "Scissors", { level: "sentence" }));

console.log(
  "7:",
  formatTimeRandom(d, {
    level: "slim",
    returnObject: true,
    truncateNumbers: true,
  })
);
console.log("8:", formatTime(d, "StoneTools", { truncateNumbers: true }));
console.log("9:", formatTime(new Date(), "Now"));
console.log("10:", formatTime(new Date(), "Then"));
