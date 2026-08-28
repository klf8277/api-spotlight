// 数据模型：与 src/data/*.json 一一对应（修改 JSON 后请同步此处）

export type PlatformStatus = "online" | "degraded" | "offline";

export type PlatformNodeType = "official" | "relay";

export interface Platform {
  id: string;
  name: string;
  /** 节点类型：official = 官方原厂直连；relay = 第三方中转（接入中转站榜单时使用） */
  type: PlatformNodeType;
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
  /** 公开信息整理的支付方式（支付宝/微信支付/国际信用卡等），以官网为准 */
  payment_methods?: string[];
  /** 境内视角可用性（本站本机实测观察）：direct=境内直连可用 / unstable=境内受限（波动或需代理）/ blocked=境内不可达 */
  cn_access?: "direct" | "unstable" | "blocked";
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
  /** 最后核验日期（YYYY-MM-DD） */
  verified_at?: string;
}

export type VerificationStatus = "verified" | "partial" | "unknown";

export interface PlatformContent {
  slug: string;
  platform_id: string;
  short_description: string;
  capabilities: string[];
  free_tier_summary: string;
  free_limits: string;
  credit_card: string;
  signup: string;
  restrictions: string[];
  pricing_url: string;
  documentation_url: string;
  website_url: string;
  last_verified: string;
  verification_status: VerificationStatus;
  recommended_use_cases: string[];
  related_resource_slugs: string[];
}

export interface FreeTierEntry {
  slug: string;
  provider: string;
  platform_id?: string;
  api_service: string;
  free_amount: string;
  unit: string;
  reset_period: string;
  rate_limits: string;
  credit_card: string;
  signup: string;
  expiration: string;
  restrictions: string[];
  official_pricing_url: string;
  official_documentation_url: string;
  official_website_url: string;
  last_verified: string;
  source_type: string;
  verification_status: VerificationStatus;
  confidence: "high" | "medium" | "low";
  related_resource_slugs: string[];
}

export interface DeveloperResource {
  slug: string;
  name: string;
  category: string;
  category_slug: string;
  description: string;
  free_summary: string;
  official_url: string;
  documentation_url?: string;
  related_platform_ids: string[];
  related_free_tier_slugs: string[];
  quality: {
    developer_relevance: number;
    api_relevance: number;
    free_value: number;
    uniqueness: number;
    source_quality: number;
    maintenance_risk: number;
    total: number;
    verdict: "Strong Candidate" | "Candidate";
  };
  last_verified: string;
}

/** 历史趋势：src/data/history.json 条目（scripts/history_update.py 产出，30 天封顶） */
export interface HistoryPlatformPoint {
  latency_ms: number | null;
  success_rate: number;
}
export interface HistoryEntry {
  date: string;
  platforms: Record<string, HistoryPlatformPoint>;
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
