// 数据模型：与 src/data/*.json 一一对应（修改 JSON 后请同步此处）

export type PlatformStatus = "online" | "degraded" | "offline";

export interface Platform {
  id: string;
  name: string;
  url: string;
  /** 带返利参数的推荐链接（可选；Footer 已声明用途） */
  affiliate_url?: string;
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
