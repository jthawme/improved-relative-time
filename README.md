# Improved relative time

2025AD? Wah?

3000BC? Who??

I know that I live in 18AiP (after iPhone)(as of 43AL (after laptop)) and that makes it much easier because its talking about things that I KNOW

I don't know an anno domini, i dont know a christ, let alone trying to comprehend what came before them??

## Demo

[Demo site](https://relative-time.jthaw.club)

Although I doubt you need convincing, I imagine this package just clicks for you

## Installation

```
npm install improved-relative-time
```

## Usage

```
import {
  formatTime,
  formatTimeRandom,
} from "improved-relative-time";

formatTime(new Date(), "Now")

formatTime(new Date(), "Then")

formatTimeRandom(new Date());


// Options
formatTimeRandom(new Date(), {
    level: "slim", // 'slim' | 'descriptive' | 'verbose' | 'sentence'
    displayIteration: false, // Sometimes abbreviations overlap, this differenatiates them
    returnObject: false, // Return the info as an object instead of a formatted string
    truncateNumbers: false, // Truncates numbers like 1800 to 1.8k
})

```
