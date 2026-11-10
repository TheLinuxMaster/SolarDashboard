import { DEFAULT_KEYS, computeSign, type SignKeys, type SignPayload } from "./sign";
import { isRecord, type JsonRecord, type RawPayloads } from "./parse";
import type { ActiveAlertEntry, InverterLogEntry } from "./log-types";
import type { PlantInfo } from "@/lib/types";

const BASE_URL =
  "https://www.cloudinverter.net/dist/server/api/CodeIgniter/index.php/Senergytec/web/v2";

const DIST_URL = "https://www.cloudinverter.net/dist/";

const BROWSER_HEADERS: Record<string, string> = {
  Accept: "application/json, text/plain, */*",
  "Content-Type": "application/json",
  Origin: "https://www.cloudinverter.net",
  Referer: "https://www.cloudinverter.net/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

export class CloudAuthError extends Error {}
export class CloudApiError extends Error {}

export type CloudClientConfig = {
  username: string;
  password: string;
  goodsId?: string;
  groupId?: string;
};

let currentKeys: SignKeys = DEFAULT_KEYS;

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
}

/**
 * If CloudInverter rotates its signing keys, pull the current 32-char key and
 * 16-char IV out of the minified JS bundle, exactly as the HA integration does.
 */
export async function refreshSignKeys(): Promise<boolean> {
  try {
    const page = await fetchWithTimeout(
      DIST_URL,
      { headers: { "User-Agent": BROWSER_HEADERS["User-Agent"] } },
      20_000,
    );
    const html = await page.text();
    const bundle = html.match(/src="[./]*(umi\.[a-f0-9]+\.js)"/);
    if (!bundle) return false;

    const jsResponse = await fetchWithTimeout(
      `${DIST_URL}${bundle[1]}`,
      { headers: { "User-Agent": BROWSER_HEADERS["User-Agent"] } },
      30_000,
    );
    const js = await jsResponse.text();
    const match = js.match(/"(\d{32})","(\d{16})"/);
    if (!match) return false;

    const next: SignKeys = {
      key: Buffer.from(match[1], "utf8"),
      iv: Buffer.from(match[2], "utf8"),
      salt: match[1],
    };
    const changed =
      next.key.toString() !== currentKeys.key.toString() ||
      next.iv.toString() !== currentKeys.iv.toString();
    currentKeys = next;
    return changed;
  } catch {
    return false;
  }
}

export class CloudInverterClient {
  private token = "";
  private memberAutoId = "";
  private plants: PlantInfo[] | null = null;
  private loginPromise: Promise<void> | null = null;

  constructor(private readonly config: CloudClientConfig) {}

  async login(): Promise<void> {
    if (this.loginPromise) return this.loginPromise;
    this.loginPromise = this.loginWithKeyRefresh().finally(() => {
      this.loginPromise = null;
    });
    return this.loginPromise;
  }

  private async loginWithKeyRefresh(): Promise<void> {
    try {
      await this.loginOnce();
      return;
    } catch (error) {
      if (!(error instanceof CloudAuthError)) throw error;
    }

    await refreshSignKeys();
    await this.loginOnce();
  }

  private async loginOnce(): Promise<void> {
    const payload: SignPayload = {
      MemberID: this.config.username,
      Password: this.config.password,
      remember: "true",
      type: "1",
    };
    payload.sign = computeSign(payload, currentKeys);

    const data = await this.post("/Inverterapi/UserLogin_v1", payload, false);
    if (data.status !== "ok") {
      throw new CloudAuthError(
        "CloudInverter rejected the login. Check the username and password.",
      );
    }

    const token = typeof data.token === "string" ? data.token : "";
    const memberAutoId =
      typeof data.MemberAutoID === "string" || typeof data.MemberAutoID === "number"
        ? String(data.MemberAutoID)
        : "";
    if (!token || !memberAutoId) {
      throw new CloudAuthError("CloudInverter returned an incomplete login response.");
    }

    this.token = token;
    this.memberAutoId = memberAutoId;
  }

  async discoverPlants(): Promise<PlantInfo[]> {
    if (this.plants) return this.plants;
    if (!this.token) await this.login();

    const groupData = await this.post("/Inverterapi/GroupList", {
      MemberAutoID: this.memberAutoId,
    });
    const groups = Array.isArray(groupData.AllGroupList) ? groupData.AllGroupList : [];

    const found: PlantInfo[] = [];
    for (const rawGroup of groups) {
      if (!isRecord(rawGroup)) continue;
      const groupId = String(rawGroup.AutoID ?? "");
      if (!groupId) continue;
      if (this.config.groupId && groupId !== this.config.groupId) continue;

      const detail = await this.post("/Inverterapi/GroupDetailList", {
        MemberAutoID: this.memberAutoId,
        GroupAutoID: groupId,
      });
      const inverters = Array.isArray(detail.AllInverterList)
        ? detail.AllInverterList
        : [];

      for (const rawInverter of inverters) {
        if (!isRecord(rawInverter)) continue;
        const goodsId = String(rawInverter.GoodsID ?? "");
        if (!goodsId) continue;
        if (this.config.goodsId && goodsId !== this.config.goodsId) continue;

        found.push({
          groupId,
          goodsId,
          name: String(rawGroup.GoodsTypeName ?? `Plant ${groupId}`),
          model: String(rawInverter.ModelName ?? "SolarMax Onyx"),
          isHybrid: Boolean(rawInverter.isHybrid),
        });

        if (this.config.goodsId) break;
      }

      if (this.config.goodsId && found.length > 0) break;
    }

    if (found.length === 0) {
      throw new CloudApiError(
        "No inverter was found on this account. Add the plant to SolarTouch first, then try again.",
      );
    }

    this.plants = found;
    return found;
  }

  async fetchAll(plant: PlantInfo): Promise<RawPayloads> {
    if (!this.token) await this.login();

    try {
      return await this.fetchAllOnce(plant);
    } catch (error) {
      if (!(error instanceof CloudAuthError)) throw error;
      this.token = "";
      await this.login();
      return this.fetchAllOnce(plant);
    }
  }

  /**
   * Inverter error logs from the web API. `GoodsTypeId` is the plant's group
   * AutoID; `selectType: 1` selects the error log (2 is the high-volume raw
   * event stream and 0 returns nothing).
   */
  async fetchLogs(
    plant: PlantInfo,
    rangeDays: number,
  ): Promise<InverterLogEntry[]> {
    if (!this.token) await this.login();
    const days = Math.min(90, Math.max(1, Math.round(rangeDays)));

    try {
      return await this.fetchLogsOnce(plant, days);
    } catch (error) {
      if (!(error instanceof CloudAuthError)) throw error;
      this.token = "";
      await this.login();
      return this.fetchLogsOnce(plant, days);
    }
  }

  /** Daily production / consumption / grid split for a date (YYYY-MM-DD). */
  async fetchDaySplit(plant: PlantInfo, date: string): Promise<JsonRecord> {
    return this.authenticated(() =>
      this.post("/Inverterapi/daytwopiechartNew", {
        GoodsID: plant.goodsId,
        inDate: date,
      }),
    );
  }

  /** 5-minute production / consumption / grid / battery curve for a date. */
  async fetchDayCurve(plant: PlantInfo, date: string): Promise<JsonRecord[]> {
    const data = await this.authenticated(() =>
      this.post("/Inverterapi/dayProductionAndConsumptionAreaTime", {
        GoodsID: plant.goodsId,
        date,
      }),
    );
    return Array.isArray(data.Data) ? data.Data.filter(isRecord) : [];
  }

  /**
   * Plant energy area curve. `date` is YYYY-MM for the daily rows of a month,
   * or YYYY for the monthly rows of a year.
   */
  async fetchAreaCurve(plant: PlantInfo, date: string): Promise<JsonRecord[]> {
    const data = await this.authenticated(() =>
      this.postRaw("/Inverterapi/groupAreaCurve", {
        groupID: plant.groupId,
        date,
      }),
    );
    return Array.isArray(data) ? data.filter(isRecord) : [];
  }

  private async authenticated<T>(run: () => Promise<T>): Promise<T> {
    if (!this.token) await this.login();

    try {
      return await run();
    } catch (error) {
      if (!(error instanceof CloudAuthError)) throw error;
      this.token = "";
      await this.login();
      return run();
    }
  }

  /** Currently active alerts reported by the web API. */
  async fetchActiveAlerts(plant: PlantInfo): Promise<ActiveAlertEntry[]> {
    if (!this.token) await this.login();

    try {
      return await this.fetchActiveAlertsOnce(plant);
    } catch (error) {
      if (!(error instanceof CloudAuthError)) throw error;
      this.token = "";
      await this.login();
      return this.fetchActiveAlertsOnce(plant);
    }
  }

  private async fetchActiveAlertsOnce(
    plant: PlantInfo,
  ): Promise<ActiveAlertEntry[]> {
    const data = await this.post("/Inverterapi/getPvierrorRealtime", {
      GoodsID: plant.goodsId,
    });
    return Array.isArray(data.data)
      ? (data.data as ActiveAlertEntry[])
      : [];
  }

  private async fetchLogsOnce(
    plant: PlantInfo,
    rangeDays: number,
  ): Promise<InverterLogEntry[]> {
    const end = new Date();
    const start = new Date(
      end.getTime() - Math.max(0, rangeDays - 1) * 24 * 60 * 60 * 1000,
    );
    const date = (value: Date) => value.toISOString().slice(0, 10);

    const data = await this.post("/Inverterapi/logsearch", {
      MemberID: this.config.username,
      GoodsTypeId: plant.groupId,
      SDate: date(start),
      EDate: date(end),
      selectType: 1,
    });

    if (Array.isArray(data.infoerror)) {
      return data.infoerror as InverterLogEntry[];
    }
    if (
      data.infoerror === undefined &&
      Number(data.total_error_num) === 0
    ) {
      return [];
    }

    throw new CloudApiError(
      "The inverter log search returned an unexpected response.",
    );
  }

  private async fetchAllOnce(plant: PlantInfo): Promise<RawPayloads> {
    const [monitor, plantDetail, flow, info] = await Promise.all([
      this.post("/Inverterapi/MemberMonitor", {
        MemberAutoID: this.memberAutoId,
      }),
      this.post("/Inverterapi/GroupDetailList", {
        MemberAutoID: this.memberAutoId,
        GroupAutoID: plant.groupId,
      }),
      this.post("/Inverterapi/getHybridFlowgraph", {
        MemberAutoID: this.memberAutoId,
        GoodsID: plant.goodsId,
      }),
      this.post("/Inverterapi/InverterDetailInfoNewone", {
        MemberAutoID: this.memberAutoId,
        GoodsID: plant.goodsId,
      }),
    ]);

    const inverterList = Array.isArray(plantDetail.AllInverterList)
      ? plantDetail.AllInverterList
      : [];
    const plantStats = isRecord(inverterList[0]) ? inverterList[0] : {};

    return {
      monitor,
      plantStats,
      flow,
      info,
    };
  }

  private async post(
    path: string,
    payload: SignPayload,
    auth = true,
  ): Promise<JsonRecord> {
    const parsed = await this.postRaw(path, payload, auth);
    if (!isRecord(parsed)) {
      throw new CloudApiError(`Unexpected response shape from ${path}.`);
    }
    return parsed;
  }

  private async postRaw(
    path: string,
    payload: SignPayload,
    auth = true,
  ): Promise<unknown> {
    const body: SignPayload = { ...payload };
    if (auth && body.sign === undefined) {
      body.sign = computeSign(body, currentKeys);
    }

    const headers = { ...BROWSER_HEADERS };
    if (auth && this.token) headers.Authorization = this.token;

    let response: Response;
    try {
      response = await fetchWithTimeout(
        BASE_URL + path,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        },
        15_000,
      );
    } catch (error) {
      throw new CloudApiError(
        `Could not reach CloudInverter (${path}): ${
          error instanceof Error ? error.message : "network error"
        }`,
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new CloudAuthError(`CloudInverter returned HTTP ${response.status}.`);
    }
    if (!response.ok) {
      throw new CloudApiError(
        `CloudInverter returned HTTP ${response.status} on ${path}.`,
      );
    }

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new CloudApiError(
        `CloudInverter returned a non-JSON response on ${path}. The API may be temporarily unavailable.`,
      );
    }
    return parsed;
  }
}
