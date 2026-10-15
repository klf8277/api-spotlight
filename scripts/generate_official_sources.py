#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate src/data/official_sources.json manifest for the 16 foundation-model labs.

Stage 3 双站重组（2026-10-15）：主站收敛为 16 家自研基座原厂（境外 7 雄 + 境内 9 强），
算力托管云 / 聚合网关已全量剥离迁往商业站。本生成器与 src/data/official_sources.json
保持逐字同步；任何增删厂牌必须先过架构裁定并同步 scripts/contract_validation.py 白名单。
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "data"

sources = [
    {
        "platform_id": "provider-openai",
        "name": "OpenAI",
        "type": "official",
        "models_url": "https://developers.openai.com/api/docs/models",
        "api_endpoint": "https://api.openai.com/v1/models",
        "selector": "models",
        "active_models": [
            "gpt-6-astra",
            "gpt-6.1-sol",
            "gpt-6-luna"
        ],
        "last_verified": "2026-10-15",
        "evidence": "developers.openai.com/api/docs/models documentation confirmed (GPT-6 Astra flagship, GPT-6.1 Sol, GPT-6 Luna)"
    },
    {
        "platform_id": "provider-anthropic",
        "name": "Anthropic",
        "type": "official",
        "models_url": "https://docs.anthropic.com/en/docs/about-claude/models",
        "api_endpoint": "https://api.anthropic.com/v1/models",
        "selector": "models",
        "active_models": [
            "claude-opus-5-5",
            "claude-sonnet-5-5",
            "claude-haiku-5-5"
        ],
        "last_verified": "2026-10-15",
        "evidence": "docs.anthropic.com/en/docs/about-claude/models documentation confirmed (Claude 5.5 generation: Opus, Sonnet, Haiku)"
    },
    {
        "platform_id": "provider-google",
        "name": "Google Gemini",
        "type": "official",
        "models_url": "https://ai.google.dev/gemini-api/docs/models",
        "api_endpoint": "https://generativelanguage.googleapis.com/v1beta/models",
        "selector": "models",
        "active_models": [
            "gemini-4-argon",
            "gemini-3.8-flash",
            "gemini-3.8-flash-lite"
        ],
        "last_verified": "2026-10-15",
        "evidence": "ai.google.dev/gemini-api/docs/models documentation confirmed (Gemini 4 Argon is now available, Gemini 3.8 Flash)"
    },
    {
        "platform_id": "provider-meta",
        "name": "Meta",
        "type": "official",
        "models_url": "https://dev.meta.ai/models/muse-wonder",
        "api_endpoint": "https://api.meta.com/v1/models",
        "selector": "models",
        "active_models": [
            "muse-wonder-1.0",
            "muse-spark-1.3"
        ],
        "last_verified": "2026-10-15",
        "evidence": "dev.meta.ai/models/muse-wonder documentation confirmed (MUSE family cloud API roster: Muse Wonder 1.0 agentic flagship and Muse Spark 1.3 long-context workhorse; note: Glimmer 30B is a local open-weight release, not a cloud API model, and is excluded from this list)"
    },
    {
        "platform_id": "provider-xai",
        "name": "xAI (Grok)",
        "type": "official",
        "models_url": "https://docs.x.ai/docs/models",
        "api_endpoint": "https://api.x.ai/v1/models",
        "selector": "models",
        "active_models": [
            "grok-4.7",
            "grok-4.6",
            "grok-4.5"
        ],
        "last_verified": "2026-10-15",
        "evidence": "docs.x.ai/docs/models documentation confirmed (Grok 4.7 recommended, Grok 4.6, Grok 4.5 listed)"
    },
    {
        "platform_id": "provider-cohere",
        "name": "Cohere",
        "type": "official",
        "models_url": "https://docs.cohere.com/docs/models",
        "api_endpoint": "https://api.cohere.com/v1/models",
        "selector": "models",
        "active_models": [
            "command-a-plus-05-2026",
            "command-a-03-2025",
            "command-r-plus-08-2024"
        ],
        "last_verified": "2026-10-15",
        "evidence": "docs.cohere.com/docs/models documentation confirmed (Command A+ 05-2026, Command A 03-2025, Command R+ 08-2024 live versions listed)"
    },
    {
        "platform_id": "provider-mistral",
        "name": "Mistral AI",
        "type": "official",
        "models_url": "https://docs.mistral.ai/getting-started/models/",
        "api_endpoint": "https://api.mistral.ai/v1/models",
        "selector": "data",
        "active_models": [
            "mistral-large-latest",
            "codestral-latest",
            "mistral-small-latest"
        ],
        "last_verified": "2026-10-15",
        "evidence": "docs.mistral.ai/getting-started/models/ (Mistral Large Latest, Codestral Latest canonical endpoints)"
    },
    {
        "platform_id": "provider-deepseek",
        "name": "深度求索 (DeepSeek)",
        "type": "official",
        "models_url": "https://api-docs.deepseek.com",
        "api_endpoint": "https://api.deepseek.com/models",
        "selector": "data",
        "active_models": [
            "deepseek-v4-pro",
            "deepseek-flash",
            "deepseek-v4-flash"
        ],
        "last_verified": "2026-10-15",
        "evidence": "api-docs.deepseek.com documentation confirmed (deepseek-v4-pro, deepseek-flash, deepseek-v4-flash endpoints)"
    },
    {
        "platform_id": "provider-moonshot",
        "name": "月之暗面 (Moonshot AI)",
        "type": "official",
        "models_url": "https://platform.moonshot.cn/docs/pricing",
        "api_endpoint": "https://api.moonshot.cn/v1/models",
        "selector": "data",
        "active_models": [
            "kimi-k3",
            "kimi-k2.7-code",
            "kimi-k2.6"
        ],
        "last_verified": "2026-10-15",
        "evidence": "platform.moonshot.cn/docs/pricing (Kimi K3 flagship series confirmed)"
    },
    {
        "platform_id": "provider-zhipu",
        "name": "智谱 AI (Zhipu AI)",
        "type": "official",
        "models_url": "https://open.bigmodel.cn/dev/api",
        "api_endpoint": "https://open.bigmodel.cn/api/paas/v4/models",
        "selector": "data",
        "active_models": [
            "glm-5.3",
            "glm-5.3-Flash",
            "glm-4.7"
        ],
        "last_verified": "2026-10-15",
        "evidence": "open.bigmodel.cn/dev/api (GLM-5.3 generation flagship & flash models)"
    },
    {
        "platform_id": "provider-bailian",
        "name": "阿里百炼 (Aliyun Bailian)",
        "type": "official",
        "models_url": "https://help.aliyun.com/zh/model-studio/developer-reference",
        "api_endpoint": "https://dashscope.aliyuncs.com/compatible-mode/v1/models",
        "selector": "data",
        "active_models": [
            "qwen3.8-max",
            "qwen3.6-plus",
            "qwen3.5-flash"
        ],
        "last_verified": "2026-10-15",
        "evidence": "help.aliyun.com/zh/model-studio (Qwen3.8-Max flagship, Qwen3.6-Plus, Qwen3.5-Flash)"
    },
    {
        "platform_id": "provider-qianfan",
        "name": "百度千帆 (Baidu Qianfan)",
        "type": "official",
        "models_url": "https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Nlks5zkzu",
        "api_endpoint": "https://qianfan.baidubce.com/v2/models",
        "selector": "data",
        "active_models": [
            "ernie-5.1",
            "ernie-4.5-turbo-128k",
            "ernie-speed-128k"
        ],
        "last_verified": "2026-10-15",
        "evidence": "cloud.baidu.com/doc/WENXINWORKSHOP (ERNIE 5.1 generation and ERNIE 4.5 Turbo)"
    },
    {
        "platform_id": "provider-volcano",
        "name": "火山方舟 (Volcengine Ark)",
        "type": "official",
        "models_url": "https://www.volcengine.com/docs/82379/1099475",
        "api_endpoint": "https://ark.cn-beijing.volces.com/api/v3/models",
        "selector": "data",
        "active_models": [
            "doubao-seed-2-1-pro",
            "doubao-seed-2-1-lite",
            "doubao-seed-evolving"
        ],
        "last_verified": "2026-10-15",
        "evidence": "volcengine.com/docs/82379 (Doubao Seed 2.1 Pro / Lite model lineup)"
    },
    {
        "platform_id": "provider-tencent",
        "name": "腾讯混元 (Tencent Hunyuan)",
        "type": "official",
        "models_url": "https://cloud.tencent.com/document/product/1729/104753",
        "api_endpoint": "https://api.hunyuan.cloud.tencent.com/v1/models",
        "selector": "data",
        "active_models": [
            "hunyuan-t1-latest",
            "hunyuan-pro",
            "hunyuan-turbos-latest"
        ],
        "last_verified": "2026-10-15",
        "evidence": "cloud.tencent.com/document/product/1729 (Hunyuan T1 latest flagship series)"
    },
    {
        "platform_id": "provider-minimax",
        "name": "MiniMax",
        "type": "official",
        "models_url": "https://platform.minimaxi.com/document/models",
        "api_endpoint": "https://api.minimax.chat/v1/models",
        "selector": "data",
        "active_models": [
            "MiniMax-M3.1-Flash-Preview",
            "MiniMax-M3",
            "MiniMax-Text-01"
        ],
        "last_verified": "2026-10-15",
        "evidence": "platform.minimaxi.com/document/models (MiniMax M3.1 Flash and M3 enterprise series)"
    },
    {
        "platform_id": "provider-stepfun",
        "name": "阶跃星辰 (StepFun)",
        "type": "official",
        "models_url": "https://platform.stepfun.com/docs/llm/model",
        "api_endpoint": "https://api.stepfun.com/v1/models",
        "selector": "data",
        "active_models": [
            "step-5-preview",
            "step-3.7-flash",
            "step-2"
        ],
        "last_verified": "2026-10-15",
        "evidence": "platform.stepfun.com/docs/llm/model (Step-5 Preview flagship & Step-3.7 Flash)"
    }
]

manifest = {
    "schema_version": "1.0",
    "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "sources_count": len(sources),
    "sources": sources,
}

out_path = SRC / "official_sources.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"OK official_sources.json generated with {len(sources)} platforms at {out_path}")
