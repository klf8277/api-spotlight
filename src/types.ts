// 数据模型：与 src/data/*.json 一一对应（修改 JSON 后请同步此处）

export type PlatformStatus = "online" | "degraded" | "offline";

export interface Platform {
  id: string;
  name: string;
  url: string;
  /** 探测用 API 基础地址；不填则回退 url（官网与 API 同源的平台无需设置） */
  api_base?: string;
  /** 已废弃：Zero Affiliate 定位下恒为 null，字段保留兼容旧数据 */
  affiliate_url?: string | null;
  status: PlatformStatus;
  /** 最近实测延迟中位数（ms），无数据时为 null */
  latency_ms: number | null;
  /** 成功率 0-100（百分比数值，非字符串） */
  success_rate: number;
  supported_models: string[];
  is_featured?: boolean;
  tags?: string[];
  /** 当前测试用的端点路径，默认 /v1/models */
  test_endpoint: string;
  /** 测试 Key 对应的环境变量名（值为变量名，不是 Key 本身） */
  api_key_env?: string;
  /** 最近实测时间，ISO8601 */
  last_checked: string;
}

export interface Perk {
  id: string;
  name: string;
  provider: string;
  content: string;
  requirement?: string;
  link: string;
  expires_at?: string;
  tag?: string;
  is_hot?: boolean;
}

/** 真实性抽查报告：src/data/authenticity.json 的 reports 条目（scripts/authenticity_test.py --apply 产出） */
export interface AuthenticityReport {
  platform_id: string;
  model: string;
  endpoint?: string;
  /** authentic | suspect | unknown | skipped | no-response */
  verdict: string;
  samples?: number;
  temps?: number[];
  latency_ms?: number;
  token_median?: number;
  token_stdev_pct?: number;
  repeat_ratio?: number;
  self_id_seen?: string | null;
  summary?: string;
  note?: string | null;
  checked_at: string;
}
