import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeNotifications } from "./notifications";

test("normalizes web log-search entries, statuses and severities", () => {
  const result = normalizeNotifications(
    [
      {
        GoodsName: "Inverter A",
        ModelName: "SM-ONYX",
        Time: "2026-11-02 11:32:00",
        ErrorCode: "2",
        status: "1",
      },
      {
        GoodsName: "Inverter A",
        ModelName: "SM-ONYX",
        Time: "2026-11-02 11:31:56",
        ErrorCode: "1",
        status: "1",
      },
      {
        GoodsName: "Inverter A",
        ModelName: "SM-ONYX",
        Time: "2026-11-02 10:00:00",
        ErrorCode: "9",
        status: "0",
      },
      {
        GoodsName: "Inverter A",
        Time: "2026-11-02 09:00:00",
        ErrorCode: "32",
        status: "1",
      },
    ],
    [
      {
        GoodsName: "Inverter A",
        ErrorCode: 38,
        Time: "2026-11-02 16:00:19",
        Type: "",
      },
    ],
    30,
  );

  assert.equal(result.total, 4);
  assert.equal(result.faults, 1);
  assert.equal(result.notices, 3);
  assert.equal(result.activeCount, 2);
  assert.equal(result.rangeDays, 30);
  assert.equal(result.notifications[0].message, "CJ-Meter or CT lost");
  assert.equal(result.notifications[0].active, true);
  assert.equal(result.notifications[0].source, "active");
  assert.equal(result.notifications[0].device, "Inverter A");
  assert.equal(
    result.notifications.some((item) => item.code === 32),
    false,
  );
  assert.equal(
    result.notifications.find((item) => item.code === 9)?.severity,
    "fault",
  );
  assert.equal(
    result.notifications.find((item) => item.code === 2)?.severity,
    "notice",
  );
});
