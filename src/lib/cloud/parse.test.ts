import { test } from "node:test";
import assert from "node:assert/strict";

import { parseSnapshot } from "./parse";

test("normalizes a CloudInverter poll into the dashboard snapshot shape", () => {
  const snapshot = parseSnapshot(
    {
      monitor: { AllLight: { Green: 1 } },
      plantStats: {
        CurrPac: 4200,
        EToday: 12400,
        ETotal: 18400000,
        Htotal: 1234.5,
      },
      flow: { Pbat: -1500, gridCurrpac: -200, loadCurrpac: 2900 },
      info: {
        data: { Vdc: [400, 380], Idc: [5, 4], Pdc: [2, 1.5] },
        ESP32Version: { Status: "Online" },
        Operatingmode: 1,
        SOC: 72,
        SOH: 96,
        volt: 51.2,
        cur: -29.3,
        BMS_temp: 28,
        toPbat: 1500,
        fromPbat: 0,
        BMS_Status: "Normal",
        brand: "PYLON",
        capacity: 400,
        batChrg: 3.4,
        batDischrg: 2.1,
        Etotal_batChrg: 6420,
        Etotal_batDischrg: 5918,
        bmsChargeVolLimit: 57.6,
        bmsChargeCurLimit: 100,
        bmsDischargeVolLimit: 44,
        bmsDishargeCurLimit: 100,
        BMS_version: "V1.8.2",
        Batterynum: 4,
        Tntc: 43,
        FirmwareVersion: "V2.3.1",
        Dailyself_userate: 68.2,
        Dailyself_sufficiencyrate: 72.4,
        WifiStrength: -57,
        gridVac: [230.1],
        gridIac: [1.2],
        gridFac: 50,
        EFToday: 4.1,
        EFTotal: 9842.3,
        ETDay: 1.2,
        ETTotal: 12764.8,
        loadVac: [230.0],
        loadIac: [12.6],
        loadFac: 50,
        ELDay: 9.8,
        ELTotal: 21584.2,
        epsCurrpac: [0],
        epsVac: [230],
        epsIac: [0],
        epsFac: 50,
        EPSDay: 0,
        EPSTotal: 0,
        Peackpower: 8640,
        gridCurrpac: [-200],
      },
    },
    "2026-11-02T12:00:00.000Z",
  );

  assert.equal(snapshot.timestamp, "2026-11-02T12:00:00.000Z");
  assert.equal(snapshot.solar.powerW, 4200);
  assert.equal(snapshot.solar.energyTodayKWh, 12.4);
  assert.equal(snapshot.solar.energyTotalKWh, 18400);
  assert.equal(snapshot.grid.powerW, -200);
  assert.equal(snapshot.grid.voltageV, 230.1);
  assert.equal(snapshot.home.powerW, 2900);
  assert.equal(snapshot.battery.powerW, 1500);
  assert.equal(snapshot.battery.charging, true);
  assert.equal(snapshot.battery.soc, 72);
  assert.equal(snapshot.inverter.status, "Normal");
  assert.equal(snapshot.inverter.operatingStatus, "On-grid");
  assert.deepEqual(snapshot.pv[0], {
    index: 1,
    voltageV: 400,
    currentA: 5,
    powerW: 2000,
  });
  assert.deepEqual(snapshot.pv[2], {
    index: 3,
    voltageV: 0,
    currentA: 0,
    powerW: 0,
  });
});
