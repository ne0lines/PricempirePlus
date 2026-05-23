const test = require("node:test");
const assert = require("node:assert/strict");

const { formatUsd, summarizePriceRange } = require("../price-history.js");

test("summarizes all-time low, high, and current position from cent values", () => {
  const points = [
    [1, 111828, 0],
    [2, 547667, 0],
    [3, 211355, 0],
  ];

  assert.deepEqual(summarizePriceRange(points, 211355), {
    lowCents: 111828,
    highCents: 547667,
    positionPercent: 22.84,
  });
});

test("clamps the current position to the all-time range", () => {
  const points = [
    [1, 10000, 0],
    [2, 20000, 0],
  ];

  assert.equal(summarizePriceRange(points, 5000).positionPercent, 0);
  assert.equal(summarizePriceRange(points, 25000).positionPercent, 100);
});

test("ignores unavailable or invalid historical price points", () => {
  const points = [
    [1, 0, 0],
    [2, null, 0],
    [3, 17500, 0],
    [4, 22500, 0],
  ];

  assert.deepEqual(summarizePriceRange(points, 20000), {
    lowCents: 17500,
    highCents: 22500,
    positionPercent: 50,
  });
});

test("formats cent values as dollar prices", () => {
  assert.equal(formatUsd(111828), "$1,118.28");
  assert.equal(formatUsd(547667), "$5,476.67");
});
