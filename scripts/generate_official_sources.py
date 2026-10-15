#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate src/data/official_sources.json manifest for all 27 platforms."""

import json
import sys
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
        "active_models": ["gpt-6-astra", "gpt-6.1-sol", "gpt-6-luna"],
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
        "active_models": ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"],
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
        "active_models": ["gemini-4-argon", "gemini-3.8-flash", "gemini-3.8-flash-lite"],
        "last_verified": "2026-10-15",
        "evidence": "ai.google.dev/gemini-api/docs/models documentation confirmed (Gemini 4 Argon is now available, Gemini 3.8 Flash)"
    },
    {
        "platform_id": "provider-xai",
        "name": "xAI (Grok)",
        "type": "official",
        "models_url": "https://docs.x.ai/docs/models",
        "api_endpoint": "https://api.x.ai/v1/models",
        "selector": "models",
        "active_models": ["grok-4.7", "grok-4.6", "grok-4.5"],
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
        "active_models": ["command-a-plus", "command-a", "command-r-plus"],
        "last_verified": "2026-10-15",
        "evidence": "docs.cohere.com/docs/models documentation confirmed (Command A+, Command A, Command R+ listed in live docs)"
    },
    {
        "platform_id": "provider-groq",
        "name": "Groq",
        "type": "relay",
        "models_url": "https://console.groq.com/docs/models",
        "api_endpoint": "https://api.groq.com/openai/v1/models",
        "selector": "data",
        "active_models": ["meta-llama/Llama-3.3-70B-Versatile", "deepseek-ai/DeepSeek-R1-Distill-Llama-70B", "meta-llama/Llama-3.1-8B-Instant"],
        "hosted_upstream": ["meta-llama", "deepseek-ai", "meta-llama"],
        "last_verified": "2026-10-15",
        "evidence": "console.groq.com/docs/models (LPU inference engine hosting Meta Llama 3.3 and DeepSeek-R1 distillation)"
    },
    {
        "platform_id": "provider-mistral",
        "name": "Mistral AI",
        "type": "official",
        "models_url": "https://docs.mistral.ai/getting-started/models/",
        "api_endpoint": "https://api.mistral.ai/v1/models",
        "selector": "data",
        "active_models": ["mistral-large-latest", "codestral-latest", "mistral-small-latest"],
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
        "active_models": ["deepseek-v4-pro", "deepseek-flash", "deepseek-v4-flash"],
        "last_verified": "2026-10-15",
        "evidence": "api-docs.deepseek.com documentation confirmed (deepseek-v4-pro, deepseek-flash, deepseek-v4-flash endpoints)"
    },
    {
        "platform_id": "provider-siliconflow",
        "name": "硅基流动 (SiliconFlow)",
        "type": "relay",
        "models_url": "https://docs.siliconflow.cn/docs/model-names",
        "api_endpoint": "https://api.siliconflow.cn/v1/models",
        "selector": "data",
        "active_models": ["Qwen/Qwen2.5-72B-Instruct", "deepseek-ai/DeepSeek-V3", "deepseek-ai/DeepSeek-R1"],
        "hosted_upstream": ["Qwen", "deepseek-ai", "deepseek-ai"],
        "last_verified": "2026-10-15",
        "evidence": "docs.siliconflow.cn/docs/model-names (Model list for SiliconCloud hosted open weights)"
    },
    {
        "platform_id": "provider-moonshot",
        "name": "月之暗面 (Moonshot AI)",
        "type": "official",
        "models_url": "https://platform.moonshot.cn/docs/pricing",
        "api_endpoint": "https://api.moonshot.cn/v1/models",
        "selector": "data",
        "active_models": ["kimi-k3", "kimi-k2.7-code", "kimi-k2.6"],
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
        "active_models": ["glm-5.3", "glm-5.3-Flash", "glm-4.7"],
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
        "active_models": ["qwen3.8-max", "qwen3.6-plus", "qwen3.5-flash"],
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
        "active_models": ["ernie-5.1", "ernie-4.5-turbo-128k", "ernie-speed-128k"],
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
        "active_models": ["doubao-seed-2-1-pro", "doubao-seed-2-1-lite", "doubao-seed-evolving"],
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
        "active_models": ["hunyuan-t1-latest", "hunyuan-pro", "hunyuan-turbos-latest"],
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
        "active_models": ["MiniMax-M3.1-Flash-Preview", "MiniMax-M3", "MiniMax-Text-01"],
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
        "active_models": ["step-5-preview", "step-3.7-flash", "step-2"],
        "last_verified": "2026-10-15",
        "evidence": "platform.stepfun.com/docs/llm/model (Step-5 Preview flagship & Step-3.7 Flash)"
    },
    {
        "platform_id": "provider-together",
        "name": "Together AI",
        "type": "relay",
        "models_url": "https://docs.together.ai/docs/inference-models",
        "api_endpoint": "https://api.together.xyz/v1/models",
        "selector": "data",
        "active_models": ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "deepseek-ai/DeepSeek-R1", "meta-llama/Llama-3.1-8B-Instruct-Turbo"],
        "hosted_upstream": ["meta-llama", "deepseek-ai", "meta-llama"],
        "last_verified": "2026-10-15",
        "evidence": "docs.together.ai/docs/inference-models (Hosted open models on Together Inference Cloud)"
    },
    {
        "platform_id": "provider-fireworks",
        "name": "Fireworks AI",
        "type": "relay",
        "models_url": "https://docs.fireworks.ai/models",
        "api_endpoint": "https://api.fireworks.ai/inference/v1/models",
        "selector": "data",
        "active_models": ["meta-llama/llama-v3p3-70b-instruct", "deepseek-ai/deepseek-r1", "meta-llama/llama-v3p1-8b-instruct"],
        "hosted_upstream": ["meta-llama", "deepseek-ai", "meta-llama"],
        "last_verified": "2026-10-15",
        "evidence": "docs.fireworks.ai/models (Fireworks Compound Inference cloud hosting Meta Llama & DeepSeek)"
    },
    {
        "platform_id": "provider-novita",
        "name": "Novita AI",
        "type": "relay",
        "models_url": "https://novita.ai/docs/model-api/models",
        "api_endpoint": "https://api.novita.ai/v3/openai/models",
        "selector": "data",
        "active_models": ["meta-llama/llama-3.3-70b-instruct", "deepseek-ai/deepseek-r1", "deepseek-ai/deepseek-v3"],
        "hosted_upstream": ["meta-llama", "deepseek-ai", "deepseek-ai"],
        "last_verified": "2026-10-15",
        "evidence": "novita.ai/docs/model-api/models (Serverless LLM inference for open weights)"
    },
    {
        "platform_id": "provider-perplexity",
        "name": "Perplexity",
        "type": "relay",
        "models_url": "https://docs.perplexity.ai/guides/model-cards",
        "api_endpoint": "https://api.perplexity.ai/models",
        "selector": "data",
        "active_models": ["sonar-reasoning-pro", "sonar-pro", "sonar"],
        "last_verified": "2026-10-15",
        "evidence": "docs.perplexity.ai/guides/model-cards (Sonar online search reasoning models)"
    },
    {
        "platform_id": "provider-nvidia",
        "name": "NVIDIA NIM",
        "type": "relay",
        "models_url": "https://build.nvidia.com/explore/discover",
        "api_endpoint": "https://integrate.api.nvidia.com/v1/models",
        "selector": "data",
        "active_models": ["meta/llama-3.3-70b-instruct", "nvidia/llama-3.1-nemotron-70b-instruct", "deepseek-ai/deepseek-r1"],
        "hosted_upstream": ["meta-llama", "nvidia", "deepseek-ai"],
        "last_verified": "2026-10-15",
        "evidence": "build.nvidia.com/explore/discover (Microservice container inference endpoints)"
    },
    {
        "platform_id": "provider-huggingface",
        "name": "Hugging Face",
        "type": "relay",
        "models_url": "https://huggingface.co/docs/api-inference/detailed_parameters",
        "api_endpoint": "https://api-inference.huggingface.co/models",
        "selector": "data",
        "active_models": ["meta-llama/Llama-3.3-70B-Instruct", "Qwen/Qwen2.5-Coder-32B-Instruct", "deepseek-ai/DeepSeek-R1"],
        "hosted_upstream": ["meta-llama", "Qwen", "deepseek-ai"],
        "last_verified": "2026-10-15",
        "evidence": "huggingface.co/docs/api-inference (Serverless inference API for popular hubs)"
    },
    {
        "platform_id": "provider-cerebras",
        "name": "Cerebras",
        "type": "relay",
        "models_url": "https://inference-docs.cerebras.ai/models",
        "api_endpoint": "https://api.cerebras.ai/v1/models",
        "selector": "data",
        "active_models": ["meta-llama/llama3.3-70b", "Qwen/qwen2.5-coder-32b", "meta-llama/llama3.1-8b"],
        "hosted_upstream": ["meta-llama", "Qwen", "meta-llama"],
        "last_verified": "2026-10-15",
        "evidence": "inference-docs.cerebras.ai/models (Wafer-scale CS-3 inference for open source architectures)"
    },
    {
        "platform_id": "provider-deepinfra",
        "name": "DeepInfra",
        "type": "relay",
        "models_url": "https://deepinfra.com/models",
        "api_endpoint": "https://api.deepinfra.com/v1/openai/models",
        "selector": "data",
        "active_models": ["meta-llama/Llama-3.3-70B-Instruct", "deepseek-ai/DeepSeek-R1", "deepseek-ai/DeepSeek-V3"],
        "hosted_upstream": ["meta-llama", "deepseek-ai", "deepseek-ai"],
        "last_verified": "2026-10-15",
        "evidence": "deepinfra.com/models (High-throughput inference cloud for open weights)"
    },
    {
        "platform_id": "provider-sambanova",
        "name": "SambaNova",
        "type": "relay",
        "models_url": "https://docs.sambanova.ai/cloud/docs/capabilities/models",
        "api_endpoint": "https://api.sambanova.ai/v1/models",
        "selector": "data",
        "active_models": ["Meta-Llama-3.3-70B-Instruct", "deepseek-ai/DeepSeek-R1", "Meta-Llama-3.1-8B-Instruct"],
        "hosted_upstream": ["meta-llama", "deepseek-ai", "meta-llama"],
        "last_verified": "2026-10-15",
        "evidence": "docs.sambanova.ai/cloud/docs/capabilities/models (DataScale SN40L hardware-accelerated endpoints)"
    },
    {
        "platform_id": "provider-agnes",
        "name": "Agnes AI",
        "type": "relay",
        "models_url": "https://agnes-ai.com/docs/models",
        "api_endpoint": "https://api.agnes-ai.com/v1/models",
        "selector": "data",
        "active_models": ["agnes-3.0-pro", "agnes-2.5-flash", "agnes-image-2.1-flash"],
        "last_verified": "2026-10-15",
        "evidence": "agnes-ai.com/docs/models (Agnes API platform model catalog)"
    }
]

manifest = {
    "schema_version": "1.0",
    "generated_at": "2026-10-15T19:25:00Z",
    "sources_count": len(sources),
    "sources": sources
}

out_path = SRC / "official_sources.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"✓ official_sources.json generated with {len(sources)} platforms at {out_path}")
