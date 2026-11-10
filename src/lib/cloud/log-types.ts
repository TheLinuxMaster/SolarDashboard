/** One entry returned by the web API's `/Inverterapi/logsearch`. */
export type InverterLogEntry = {
  ModelName?: string | null;
  GoodsName?: string | null;
  MemberID?: string | null;
  GoodsID?: string | null;
  Time?: string | null;
  ErrorCode?: string | number | null;
  status?: string | number | null;
};

/** One current alert returned by `/Inverterapi/getPvierrorRealtime`. */
export type ActiveAlertEntry = {
  GoodsID?: string | null;
  GoodsName?: string | null;
  ErrorCode?: string | number | null;
  Time?: string | null;
  Type?: string | null;
};
