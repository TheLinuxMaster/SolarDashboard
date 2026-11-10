import { test } from "node:test";
import assert from "node:assert/strict";

import {
  insightLabel,
  sumEnergyPoints,
  toDayCurve,
  toEnergyPoints,
  toEnergySplit,
} from "./insights";

test("maps the daily energy split", () => {
  const split = toEnergySplit({
    Production: "4.00",
    ToGrid: "0.50",
    SelfConsumption: 5,
    Consumption: "0.00",
    FromGrid: "1.25",
    SelfProduction: 2,
  });

  assert.deepEqual(split, {
    productionKWh: 4,
    toGridKWh: 0.5,
    selfConsumptionKWh: 5,
    consumptionKWh: 0,
    fromGridKWh: 1.25,
    selfProductionKWh: 2,
  });
});

test("maps the 5-minute cloud day curve", () => {
  const points = toDayCurve([
    {
      inTime: "08:00:00",
      Production: "1200.40",
      Consumption: "0.00",
      epsload: "800.20",
      powerToGrid: "0.00",
      powerFromGrid: "300.00",
      Battery: "-150.00",
      SOC: "72.4",
    },
    {
      inTime: "08:05:00",
      Production: "1300",
      Consumption: "700",
      powerToGrid: "250",
      powerFromGrid: "0",
      Battery: "100",
      SOC: "73",
    },
  ]);

  assert.equal(points.length, 2);
  assert.deepEqual(points[0], {
    time: "08:00:00",
    solarW: 1200,
    homeW: 800,
    gridW: 300,
    batteryW: -150,
    soc: 72.4,
  });
  assert.equal(points[1].gridW, -250);
});

test("maps and totals month energy rows", () => {
  const points = toEnergyPoints(
    [
      {
        day: 2,
        Production: 9,
        Consumption: 21,
        powerToGrid: 1,
        powerFromGrid: 2,
        powerToBattery: 3,
        powerFromBattery: 4,
        ConsumedDirectly: 6,
      },
      {
        day: 1,
        Production: 12,
        epsload: 25,
        powerToGrid: 0,
        powerFromGrid: 0,
        powerToBattery: 2,
        powerFromBattery: 3,
        ConsumedDirectly: 11,
      },
      { day: 0, Production: 99 },
    ],
    "month",
  );

  assert.equal(points.length, 2);
  assert.equal(points[0].label, "1");
  assert.equal(points[0].consumptionKWh, 25);
  assert.equal(points[1].key, "2");

  const totals = sumEnergyPoints(points);
  assert.deepEqual(totals, {
    productionKWh: 21,
    consumptionKWh: 46,
    toGridKWh: 1,
    fromGridKWh: 2,
    batteryChargeKWh: 5,
    batteryDischargeKWh: 7,
    selfConsumedKWh: 17,
  });
});

test("maps year rows to month labels", () => {
  const points = toEnergyPoints(
    [
      { month: 2, Production: 107, Consumption: 292 },
      { month: 1, Production: 80, Consumption: 162 },
    ],
    "year",
  );

  assert.deepEqual(
    points.map((point) => point.label),
    ["Jan", "Feb"],
  );
});

test("formats period labels", () => {
  assert.equal(insightLabel("day", "2026-11-10"), "10 Nov 2026");
  assert.equal(insightLabel("month", "2026-11"), "November 2026");
  assert.equal(insightLabel("year", "2026"), "2026");
});
