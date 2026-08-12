const DEFAULT_ORIGIN = "https://test.token-exchange-ai.com";
const HEADERS_STORAGE_KEY = "freyrModelListHeaders";
const CATEGORY_ORDER = ["music", "image", "video", "text"];
const MAX_REFERENCE_UPLOAD_BYTES = 850 * 1024;
const MAX_REFERENCE_DIMENSION = 768;
const MEDIA_POLL_INTERVAL_MS = 3000;
const MEDIA_POLL_PROBE_TIMEOUT_MS = 9000;
const MEDIA_POLL_TIMEOUT_MS = 2 * 60 * 60 * 1000;

const MODEL_ID_ALIASES = {
  "MinimaxH3-GB200-117": "MiniMax/MiniMax-H3"
};

const MODEL_META = {
  "MiniMax/MiniMax-H3": {
    category: "video",
    displayName: "MiniMax H3",
    provider: "MiniMax",
    description: "MiniMax H3 video generation model served on the GB200 cluster.",
    capabilities: ["reference-to-video", "image/video/audio reference", "synchronized audio"],
    sizes: "768x432 default",
    supportsReference: true,
    requiresReference: true,
    referenceLabel: "Reference file",
    referenceAccept: "image/*,video/*,audio/*",
    defaultVideoSize: "768x432",
    defaultVideoFps: 24,
    defaultVideoSeconds: 4,
    defaultVideoSteps: 8,
    usesVideoSeconds: true,
    binaryResponseType: "video",
    outputSlug: "minimax-h3"
  },
  "KimiK3-GB200-115": {
    category: "text",
    displayName: "Kimi K3 GB200",
    provider: "Moonshot AI",
    description: "Kimi K3 chat model served on the GB200 cluster for long-context assistant workloads.",
    capabilities: ["chat", "long context"],
    context: "1M input / 1M output tokens"
  },
  "deepseek-ai/DeepSeek-V4-Pro": {
    category: "text",
    displayName: "DeepSeek V4 Pro",
    description: "High-quality reasoning and coding chat model for production assistants and complex analysis.",
    capabilities: ["reasoning", "chat", "code"],
    context: "Long context",
    supportsReasoningToggle: true,
    reasoningTemplateKey: "thinking"
  },
  "deepseek-ai/DeepSeek-V4-Flash": {
    category: "text",
    displayName: "DeepSeek V4 Flash",
    description: "Fast DeepSeek chat model for low-latency answers, summarization, and interactive workflows.",
    capabilities: ["chat", "fast", "cost efficient"],
    context: "Long context"
  },
  "moonshotai/Kimi-K3": {
    category: "text",
    displayName: "Kimi K3",
    description: "Moonshot chat and reasoning model for long-form analysis, assistants, and tool-driven workflows.",
    capabilities: ["chat", "reasoning", "long context"],
    context: "Provider defined"
  },
  "Qwen/Qwen3.5-35B-A3B-FP8": {
    category: "text",
    displayName: "Qwen3.5 35B A3B FP8",
    description: "Efficient large chat model for multilingual assistant workloads and production inference.",
    capabilities: ["chat", "multilingual", "low latency"],
    context: "Provider defined",
    supportsReasoningToggle: true,
    reasoningTemplateKey: "enable_thinking"
  },
  "black-forest-labs/FLUX.2-dev": {
    category: "image",
    displayName: "FLUX.2 Dev",
    description: "Text-to-image generation model for visual exploration, campaign concepts, and design assets.",
    capabilities: ["text-to-image", "creative generation"],
    sizes: "1024x1024 default"
  },
  "Comfy-Org/Ideogram-4": {
    category: "image",
    displayName: "Ideogram 4",
    description: "Text-to-image generation model for high-quality visual assets and typography-aware compositions.",
    capabilities: ["text-to-image", "typography", "creative generation"],
    sizes: "1024x1024 default",
    fixedImageSteps: 20
  },
  "baidu/ERNIE-Image-Turbo": {
    category: "image",
    displayName: "ERNIE Image Turbo",
    description: "Fast text-to-image generation model for production visual content and rapid iteration.",
    capabilities: ["text-to-image", "fast generation", "creative generation"],
    sizes: "Provider defined"
  },
  "Lightricks/LTX-2.3": {
    category: "video",
    displayName: "LTX 2.3",
    description: "Video generation model for short text-to-video and image-guided motion experiments.",
    capabilities: ["text-to-video", "image-to-video", "motion"],
    sizes: "768x512 default",
    supportsReference: true
  },
  "Wan-AI/Wan2.2-T2V-A14B-Diffusers": {
    category: "video",
    displayName: "Wan2.2 T2V A14B",
    description: "Text-to-video diffusion model for prompt-driven short video generation.",
    capabilities: ["text-to-video", "diffusion"],
    sizes: "1280x720 default"
  },
  "OpenMOSS-Team/MOVA-360p": {
    category: "video",
    displayName: "MOVA 360p",
    description: "Reference-image video model for compact 360p motion generation.",
    capabilities: ["image-to-video", "reference image", "360p"],
    sizes: "352x640 smoke-test default",
    defaultVideoSize: "352x640",
    outputSlug: "mova",
    supportsReference: true,
    requiresReference: true
  },
  "jdopensource/JoyAI-Echo": {
    category: "video",
    displayName: "JoyEcho",
    description: "Video generation model for short prompt-driven clips.",
    capabilities: ["text-to-video", "video generation"],
    outputSlug: "joyecho"
  },
  "HeartMuLa/HeartMuLa-oss-3B-happy-new-year": {
    category: "music",
    displayName: "HeartMuLa OSS 3B",
    description: "Music generation model for short lyric- and style-guided audio clips.",
    capabilities: ["music generation", "lyrics", "style tags"],
    audioLength: "30s default"
  }
};

// Keep metadata for retired models above so old links render useful labels,
// but never advertise an offline upstream in the fallback catalog.
const FALLBACK_IDS = [
  "MiniMax/MiniMax-H3",
  "KimiK3-GB200-115"
];

const state = {
  headerText: localStorage.getItem(HEADERS_STORAGE_KEY) || "",
  models: [],
  selectedId: "",
  category: "all",
  query: "",
  sort: "category",
  lastPromptCategory: "",
  lastImageParamModel: "",
  lastVideoParamModel: "",
  playgroundOpen: false,
  running: false,
  previewFormat: "curl"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function apiBase() {
  return `${DEFAULT_ORIGIN}/api/native/v1`;
}

function mediaBase() {
  return DEFAULT_ORIGIN;
}

function parseHeaderLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((headers, line) => {
      const index = line.indexOf(":");
      if (index <= 0) return headers;
      const key = line.slice(0, index).trim();
      const headerValue = line.slice(index + 1).trim();
      if (key && headerValue) headers[key] = headerValue;
      return headers;
    }, {});
}

function headerValue(headers, name) {
  const match = Object.entries(headers)
    .find(([key]) => key.toLowerCase() === name.toLowerCase());
  return match ? match[1] : "";
}

function redactHeader(name, value) {
  if (!/authorization|secret|client-id/i.test(name)) return value;
  const text = String(value);
  if (text.length <= 12) return "••••";
  return `${text.slice(0, 8)}…${text.slice(-4)}`;
}

function playgroundHeaders(includeJson = true) {
  const headers = parseHeaderLines(state.headerText);
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  } else {
    Object.keys(headers).forEach((key) => {
      if (key.toLowerCase() === "content-type") delete headers[key];
    });
  }
  return headers;
}

function redactedHeaders(includeJson = true) {
  return Object.fromEntries(
    Object.entries(playgroundHeaders(includeJson)).map(([key, value]) => [key, redactHeader(key, value)])
  );
}

function providerFromId(id) {
  return id.includes("/") ? id.split("/")[0] : "Freyr";
}

function titleFromId(id) {
  return id.includes("/") ? id.split("/").slice(1).join("/") : id;
}

function canonicalModelId(id) {
  return MODEL_ID_ALIASES[id] || id;
}

function inferCategory(id) {
  id = canonicalModelId(id);
  const known = MODEL_META[id]?.category;
  if (known) return known;
  const lower = id.toLowerCase();
  if (/heartmula|music|audio|song/.test(lower)) return "music";
  if (/flux|image|t2i|stable|black-forest/.test(lower)) return "image";
  if (/video|t2v|i2v|wan|ltx|mova/.test(lower)) return "video";
  return "text";
}

function categoryFromPriceRow(priceRow = {}) {
  const usageType = String(priceRow.usage_type || "").toLowerCase();
  if (["text", "image", "video", "music"].includes(usageType)) return usageType;

  const mode = String(priceRow.mode || "").toLowerCase();
  if (mode === "image_generation") return "image";
  if (mode === "video_generation") return "video";
  if (mode === "music_generation" || mode === "audio_generation") return "music";
  return "";
}

function endpointFor(category) {
  if (category === "image") return "/api/native/v1/images/generations";
  if (category === "video") return "/api/native/v1/videos";
  if (category === "music") return "/api/native/v1/music/generations";
  return "/api/native/v1/chat/completions";
}

function categoryRank(category) {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function pricePerMillion(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed * 1_000_000 : undefined;
}

function priceLabel(model) {
  if (model.category === "text") {
    const input = model.inputPerMillionTokens;
    const output = model.outputPerMillionTokens;
    if (input === undefined || output === undefined) return "Pricing unavailable";
    return `$${input.toFixed(input < 0.1 ? 3 : 2)} input / $${output.toFixed(output < 0.1 ? 3 : 2)} output per 1M tokens`;
  }
  return "Usage and cost are returned by the media adapter response.";
}

function normalizeModel(id, priceRow = {}, source = "public model info") {
  id = canonicalModelId(id);
  const meta = MODEL_META[id] || {};
  const category = categoryFromPriceRow(priceRow) || meta.category || inferCategory(id);
  const endpoint = endpointFor(category);
  return {
    id,
    category,
    endpoint,
    source,
    displayName: meta.displayName || titleFromId(id),
    provider: meta.provider || providerFromId(id),
    description: meta.description || `${category} model served through Freyr's production API.`,
    capabilities: meta.capabilities || [category],
    context: meta.context,
    sizes: meta.sizes,
    fixedImageSteps: Number.isFinite(meta.fixedImageSteps) ? meta.fixedImageSteps : undefined,
    defaultVideoSize: meta.defaultVideoSize,
    defaultVideoFps: meta.defaultVideoFps,
    defaultVideoFrames: meta.defaultVideoFrames,
    defaultVideoSeconds: meta.defaultVideoSeconds,
    defaultVideoSteps: meta.defaultVideoSteps,
    usesVideoSeconds: Boolean(meta.usesVideoSeconds),
    binaryResponseType: meta.binaryResponseType || "",
    referenceLabel: meta.referenceLabel,
    referenceAccept: meta.referenceAccept,
    outputSlug: meta.outputSlug,
    audioLength: meta.audioLength,
    supportsReasoningToggle: Boolean(meta.supportsReasoningToggle),
    reasoningTemplateKey: meta.reasoningTemplateKey || "enable_thinking",
    supportsReference: Boolean(meta.supportsReference || meta.requiresReference),
    requiresReference: Boolean(meta.requiresReference),
    inputPerMillionTokens: pricePerMillion(priceRow.input_cost_per_token),
    outputPerMillionTokens: pricePerMillion(priceRow.output_cost_per_token),
    cacheReadInputPerMillionTokens: pricePerMillion(priceRow.cache_read_input_token_cost)
  };
}

function rowsByModelName(rows) {
  return rows.reduce((map, row) => {
    const id = canonicalModelId(row.model_name || row.id || row.name);
    if (id) map.set(id, row);
    return map;
  }, new Map());
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Request failed with status ${response.status}`);
  }
  return response.json();
}

async function fetchPublicModelInfo() {
  // The pricing route accepts the LiteLLM Authorization header. Cloudflare
  // Access headers remain on the authorized /models request below.
  const configuredHeaders = parseHeaderLines(state.headerText);
  const authorizationEntry = Object.entries(configuredHeaders)
    .find(([name]) => name.toLowerCase() === "authorization");
  const headers = authorizationEntry
    ? { Authorization: authorizationEntry[1] }
    : {};
  const data = await fetchJson(`${apiBase()}/model/info`, { headers, cache: "no-store" });
  return Array.isArray(data.data) ? data.data : [];
}

async function fetchAuthorizedModels() {
  const headers = parseHeaderLines(state.headerText);
  if (!headerValue(headers, "authorization")) throw new Error("Authorization header is required for /models.");
  const data = await fetchJson(`${apiBase()}/models`, { headers, cache: "no-store" });
  return Array.isArray(data.data) ? data.data : [];
}

function setStatus(message, type = "") {
  const node = $("#apiStatus");
  if (!node) return;
  node.textContent = message;
  node.className = `api-state ${type}`.trim();
}

async function loadModels({ authorized = false } = {}) {
  setStatus(authorized ? "Loading authorized /models and public pricing..." : "Loading public model info...");
  const pricePromise = fetchPublicModelInfo();
  const modelPromise = authorized
    ? fetchAuthorizedModels()
    : Promise.reject(new Error("Authorization header is required for /models."));
  const [priceResult, modelResult] = await Promise.allSettled([pricePromise, modelPromise]);
  const priceRows = priceResult.status === "fulfilled" ? priceResult.value : [];
  const authorizedRows = modelResult.status === "fulfilled" ? modelResult.value : [];
  const modelRows = authorizedRows.length
    ? authorizedRows
    : priceRows.map((row) => ({ id: row.model_name || row.id || row.name }));

  if (modelRows.length) {
    const source = authorizedRows.length ? "authorized /models" : "model info";
    const status = authorizedRows.length
      ? `Loaded ${authorizedRows.length} authorized models from /models.${priceRows.length ? "" : " Pricing metadata unavailable."}`
      : `Loaded ${modelRows.length} models from model info.`;
    const priceMap = rowsByModelName(priceRows);
    const seen = new Set();
    state.models = modelRows
      .map((row) => row.id || row.model_name || row.name)
      .map(canonicalModelId)
      .filter(Boolean)
      .filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((id) => normalizeModel(id, priceMap.get(id), source));

    setStatus(status, "live");
  } else {
    const errors = [priceResult, modelResult]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason));
    state.models = FALLBACK_IDS.map((id) => normalizeModel(id, {}, "local fallback"));
    setStatus(`Live API unavailable. Showing current fallback catalog. ${errors.join(" ")}`, "error");
  }

  if (!state.selectedId || !state.models.some((model) => model.id === state.selectedId)) {
    state.selectedId = state.models.find((model) => model.category === "text")?.id || state.models[0]?.id || "";
  }

  render();
}

function modelMatches(model) {
  const categoryMatches = state.category === "all" || model.category === state.category;
  const needle = state.query.trim().toLowerCase();
  const haystack = [
    model.id,
    model.displayName,
    model.provider,
    model.category,
    model.description,
    model.endpoint,
    ...model.capabilities
  ].join(" ").toLowerCase();
  return categoryMatches && haystack.includes(needle);
}

function sortedModels(models) {
  const list = [...models];
  if (state.sort === "name") return list.sort((a, b) => a.displayName.localeCompare(b.displayName));
  if (state.sort === "provider") return list.sort((a, b) => a.provider.localeCompare(b.provider));
  return list.sort((a, b) => categoryRank(a.category) - categoryRank(b.category) || a.displayName.localeCompare(b.displayName));
}

function renderCounts() {
  const counts = state.models.reduce((map, model) => {
    map[model.category] = (map[model.category] || 0) + 1;
    return map;
  }, {});
  $("#totalCount").textContent = String(state.models.length);
  $("#musicCount").textContent = String(counts.music || 0);
  $("#imageCount").textContent = String(counts.image || 0);
  $("#videoCount").textContent = String(counts.video || 0);
  $("#textCount").textContent = String(counts.text || 0);
}

function renderModels() {
  const grid = $("#modelGrid");
  if (!grid) return;
  const models = sortedModels(state.models.filter(modelMatches));
  grid.innerHTML = models.length
    ? models.map((model) => `
      <article class="model-card ${state.playgroundOpen && model.id === state.selectedId ? "is-selected" : ""}">
        <header>
          <div>
            <span class="badge ${escapeHtml(model.category)}">${escapeHtml(model.category)}</span>
            <h3>${escapeHtml(model.displayName)}</h3>
          </div>
          <span class="pill">${escapeHtml(model.provider)}</span>
        </header>
        <p>${escapeHtml(model.description)}</p>
        <div class="capabilities">${model.capabilities.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
        <div class="endpoint"><strong>Endpoint</strong> ${escapeHtml(model.endpoint)}</div>
        <div class="price"><strong>Pricing</strong> ${escapeHtml(priceLabel(model))}</div>
        <div class="model-id">${escapeHtml(model.id)}</div>
        <div class="card-actions">
          <button class="button primary" type="button" data-select-model="${escapeHtml(model.id)}">${state.playgroundOpen && model.id === state.selectedId ? "Playground open" : "Open playground"}</button>
        </div>
      </article>
    `).join("")
    : `<div class="empty">No models match the current filters.</div>`;
}

function selectedModel() {
  return state.models.find((model) => model.id === state.selectedId) || state.models[0];
}

function defaultPrompt(category) {
  if (category === "image") return "Create a photorealistic editorial image of a glass greenhouse cafe on a misty mountain ridge at sunrise, with warm interior lights, wildflowers in the foreground, cinematic composition, natural textures, soft volumetric light, and no text or watermark.";
  if (category === "video") return "Generate a short cinematic shot of a white ceramic coffee cup on a wooden desk as morning sunlight moves across it, with gentle steam rising and a slow camera push-in.";
  if (category === "music") return "[verse]\nCity lights are fading into rain\nSoft drums carry footsteps through the night\n\n[chorus]\nHold the moment, let it glow\nWarm synths rising, steady and bright";
  return "You are testing a production model catalog. In one concise paragraph, explain how a developer would choose between text, image, video, and music models for a launch demo.";
}

function endpointUrl(model) {
  if (model.category === "text") return `${apiBase()}/chat/completions`;
  return `${mediaBase()}${model.endpoint}`;
}

function numberValue(id, fallback) {
  const parsed = Number($(id)?.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function textValue(id, fallback = "") {
  const value = $(id)?.value;
  return value === undefined || value === "" ? fallback : value;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the reference image."));
    };
    image.src = url;
  });
}

async function optimizeReferenceImage(file) {
  if (!file || !file.type?.startsWith("image/") || file.size <= MAX_REFERENCE_UPLOAD_BYTES) {
    return { file, changed: false };
  }

  const image = await loadImageElement(file);
  const scale = Math.min(1, MAX_REFERENCE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  for (const quality of [0.85, 0.75, 0.65, 0.55]) {
    const blob = await canvasBlob(canvas, "image/jpeg", quality);
    if (!blob) continue;
    const optimized = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
    if (optimized.size <= MAX_REFERENCE_UPLOAD_BYTES || quality === 0.55) {
      return { file: optimized, changed: true, original: file };
    }
  }

  return { file, changed: false };
}

function buildTextRequest(model) {
  const body = {
    model: model.id,
    messages: [
      { role: "system", content: textValue("#systemPrompt") },
      { role: "user", content: textValue("#promptInput") }
    ],
    max_tokens: numberValue("#maxTokens", 256),
    temperature: numberValue("#temperature", 0.2),
    top_p: numberValue("#topP", 0.9),
    stream: Boolean($("#streamResponse")?.checked)
  };

  if (model.supportsReasoningToggle) {
    body.chat_template_kwargs = {
      [model.reasoningTemplateKey]: Boolean($("#reasoningMode")?.checked)
    };
  }

  return {
    kind: "json",
    url: endpointUrl(model),
    method: "POST",
    headers: playgroundHeaders(true),
    body
  };
}

function buildImageRequest(model) {
  const inferenceSteps = Number.isFinite(model.fixedImageSteps)
    ? model.fixedImageSteps
    : numberValue("#imageSteps", 10);
  return {
    kind: "json",
    url: endpointUrl(model),
    method: "POST",
    headers: playgroundHeaders(true),
    body: {
      model: model.id,
      prompt: textValue("#promptInput"),
      size: textValue("#imageSize", "1024x1024"),
      n: numberValue("#imageCountInput", 2),
      num_inference_steps: inferenceSteps
    }
  };
}

function buildVideoRequest(model) {
  const body = {
    model: model.id,
    prompt: textValue("#promptInput"),
    size: textValue("#videoSize", videoDefaultSize(model)),
    fps: numberValue("#videoFps", videoDefaultFps(model)),
    num_inference_steps: numberValue("#videoSteps", videoDefaultSteps(model))
  };
  if (model.usesVideoSeconds) {
    body.seconds = numberValue("#videoFrames", videoDefaultDurationValue(model));
  } else {
    body.num_frames = numberValue("#videoFrames", videoDefaultDurationValue(model));
  }
  const file = model.supportsReference ? $("#referenceImage")?.files?.[0] : null;
  const shouldUseForm = Boolean(model.supportsReference && (file || model.requiresReference));
  if (!shouldUseForm) {
    return {
      kind: "json",
      url: endpointUrl(model),
      method: "POST",
      headers: playgroundHeaders(true),
      body,
      responseType: model.binaryResponseType || ""
    };
  }

  const formData = new FormData();
  Object.entries(body).forEach(([key, value]) => formData.append(key, String(value)));
  if (file) formData.append("input_reference", file);
  return {
    kind: "form",
    url: endpointUrl(model),
    method: "POST",
    headers: playgroundHeaders(false),
    body: formData,
    previewBody: { ...body, input_reference: file?.name || "reference.file" },
    responseType: model.binaryResponseType || ""
  };
}

function buildMusicRequest(model) {
  return {
    kind: "json",
    url: endpointUrl(model),
    method: "POST",
    headers: playgroundHeaders(true),
    body: {
      model: model.id,
      lyrics: textValue("#promptInput"),
      music_tags: textValue("#musicTags", "ambient"),
      max_audio_length_ms: numberValue("#musicLength", 1000),
      temperature: numberValue("#musicTemperature", 0.8),
      topk: numberValue("#musicTopK", 50),
      cfg_scale: numberValue("#musicCfg", 4),
      return_base64: false
    }
  };
}

function buildRequest() {
  const model = selectedModel();
  if (!model) return null;
  if (model.category === "image") return buildImageRequest(model);
  if (model.category === "video") return buildVideoRequest(model);
  if (model.category === "music") return buildMusicRequest(model);
  return buildTextRequest(model);
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\"'\"'")}'`;
}

function pythonLiteral(value) {
  return JSON.stringify(value, null, 2)
    .replace(/\btrue\b/g, "True")
    .replace(/\bfalse\b/g, "False")
    .replace(/\bnull\b/g, "None");
}

function jsLiteral(value) {
  return JSON.stringify(value, null, 2);
}

function previewHeaders(request) {
  return request.kind === "form" ? redactedHeaders(false) : redactedHeaders(true);
}

function previewBody(request) {
  return request.previewBody || request.body || {};
}

function formEntries(request) {
  return Object.entries(previewBody(request));
}

function responseOutputName(request) {
  const type = request.responseType;
  if (type === "video") return "freyr-video.mp4";
  if (type === "audio") return "freyr-audio.mp3";
  if (type === "image") return "freyr-image.png";
  return "";
}

function curlPreview(request) {
  const lines = [
    `curl --request ${request.method || "POST"} \\`,
    `  --url ${shellQuote(request.url)}`
  ];

  Object.entries(previewHeaders(request)).forEach(([name, value]) => {
    lines[lines.length - 1] += " \\";
    lines.push(`  --header ${shellQuote(`${name}: ${value}`)}`);
  });

  if (request.kind === "form") {
    formEntries(request).forEach(([name, value]) => {
      lines[lines.length - 1] += " \\";
      const formValue = name === "input_reference" ? `${name}=@${value}` : `${name}=${value}`;
      lines.push(`  --form ${shellQuote(formValue)}`);
    });
    const outputName = responseOutputName(request);
    if (outputName) {
      lines[lines.length - 1] += " \\";
      lines.push(`  --output ${shellQuote(outputName)}`);
    }
    return lines.join("\n");
  }

  lines[lines.length - 1] += " \\";
  lines.push(`  --data ${shellQuote(JSON.stringify(previewBody(request), null, 2))}`);
  return lines.join("\n");
}

function pythonPreview(request) {
  const headers = pythonLiteral(previewHeaders(request));
  if (request.kind === "form") {
    const entries = formEntries(request);
    const data = Object.fromEntries(entries.filter(([name]) => name !== "input_reference"));
    const fileName = entries.find(([name]) => name === "input_reference")?.[1] || "reference.png";
    return [
      "import requests",
      "",
      `url = ${JSON.stringify(request.url)}`,
      `headers = ${headers}`,
      `data = ${pythonLiteral(data)}`,
      `files = {"input_reference": open(${JSON.stringify(fileName)}, "rb")}`,
      "",
      "try:",
      "    response = requests.post(url, headers=headers, data=data, files=files)",
      "    response.raise_for_status()",
      responseOutputName(request)
        ? `    open(${JSON.stringify(responseOutputName(request))}, "wb").write(response.content)`
        : "    print(response.json())",
      "finally:",
      "    files[\"input_reference\"].close()"
    ].join("\n");
  }

  return [
    "import requests",
    "",
    `url = ${JSON.stringify(request.url)}`,
    `headers = ${headers}`,
    `payload = ${pythonLiteral(previewBody(request))}`,
    "",
    "response = requests.post(url, headers=headers, json=payload)",
    "response.raise_for_status()",
    "print(response.json())"
  ].join("\n");
}

function typescriptPreview(request) {
  const headers = jsLiteral(previewHeaders(request));
  if (request.kind === "form") {
    const entries = formEntries(request);
    const fileName = entries.find(([name]) => name === "input_reference")?.[1] || "reference.png";
    const lines = [
      `const url = ${JSON.stringify(request.url)};`,
      `const headers = ${headers};`,
      "const formData = new FormData();"
    ];

    entries.forEach(([name, value]) => {
      if (name === "input_reference") {
        lines.push(`const referenceFile = /* selected File for ${JSON.stringify(fileName)} */ undefined as unknown as File;`);
        lines.push(`formData.append("input_reference", referenceFile, ${JSON.stringify(fileName)});`);
      } else {
        lines.push(`formData.append(${JSON.stringify(name)}, ${JSON.stringify(String(value))});`);
      }
    });

    lines.push(
      "",
      "const response = await fetch(url, {",
      "  method: \"POST\",",
      "  headers,",
      "  body: formData",
      "});",
      "",
      "if (!response.ok) throw new Error(await response.text());",
      responseOutputName(request)
        ? "console.log(URL.createObjectURL(await response.blob()));"
        : "console.log(await response.json());"
    );
    return lines.join("\n");
  }

  return [
    `const url = ${JSON.stringify(request.url)};`,
    `const headers = ${headers};`,
    `const body = ${jsLiteral(previewBody(request))};`,
    "",
    "const response = await fetch(url, {",
    "  method: \"POST\",",
    "  headers,",
    "  body: JSON.stringify(body)",
    "});",
    "",
    "if (!response.ok) throw new Error(await response.text());",
    "console.log(await response.json());"
  ].join("\n");
}

function previewRequest(request) {
  if (!request) return "";
  if (state.previewFormat === "python") return pythonPreview(request);
  if (state.previewFormat === "typescript") return typescriptPreview(request);
  return curlPreview(request);
}

function updatePlayground() {
  const model = selectedModel();
  if (!model) return;

  $("#playgroundTitle").textContent = model.displayName;
  $("#playgroundCategory").textContent = model.category;
  $("#playgroundCategory").className = `pill badge ${model.category}`;
  $("#promptLabel").textContent = model.category === "music" ? "Lyrics / prompt" : "Prompt";

  $$("[data-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== model.category;
  });
  $$("[data-reference-upload]").forEach((field) => {
    const shouldShow = model.category === "video" && model.supportsReference;
    field.hidden = !shouldShow;
    const referenceInput = $("#referenceImage");
    const referenceLabel = $("#referenceLabel");
    if (referenceLabel) referenceLabel.textContent = model.referenceLabel || "Reference image";
    if (referenceInput) referenceInput.setAttribute("accept", model.referenceAccept || "image/*");
    if (!shouldShow && $("#referenceImage")) $("#referenceImage").value = "";
  });
  $$("[data-reasoning-toggle]").forEach((field) => {
    const shouldShow = model.category === "text";
    const checkbox = $("#reasoningMode");
    field.hidden = !shouldShow;
    if (!checkbox) return;
    checkbox.disabled = !model.supportsReasoningToggle;
    if (!model.supportsReasoningToggle) checkbox.checked = false;
  });

  const prompt = $("#promptInput");
  if (prompt && state.lastPromptCategory !== model.category) {
    prompt.value = defaultPrompt(model.category);
    state.lastPromptCategory = model.category;
  }

  const imageSteps = $("#imageSteps");
  if (imageSteps) {
    const hasFixedImageSteps = model.category === "image" && Number.isFinite(model.fixedImageSteps);
    imageSteps.disabled = hasFixedImageSteps;
    if (model.category === "image" && state.lastImageParamModel !== model.id) {
      imageSteps.value = String(hasFixedImageSteps ? model.fixedImageSteps : 10);
      state.lastImageParamModel = model.id;
    }
  }

  if (model.category === "video" && state.lastVideoParamModel !== model.id) {
    const sizeInput = $("#videoSize");
    const fpsInput = $("#videoFps");
    const durationInput = $("#videoFrames");
    const stepsInput = $("#videoSteps");
    if (sizeInput) sizeInput.value = videoDefaultSize(model);
    if (fpsInput) fpsInput.value = String(videoDefaultFps(model));
    if (durationInput) durationInput.value = String(videoDefaultDurationValue(model));
    if (stepsInput) stepsInput.value = String(videoDefaultSteps(model));
    state.lastVideoParamModel = model.id;
  }
  const durationLabel = $("#videoDurationLabel");
  const durationInput = $("#videoFrames");
  if (durationLabel) durationLabel.textContent = videoDurationLabel(model);
  if (durationInput) {
    durationInput.min = model.usesVideoSeconds ? "1" : "1";
    durationInput.max = model.usesVideoSeconds ? "15" : "160";
    durationInput.step = "1";
  }

  const request = buildRequest();
  $("#requestPreview").textContent = previewRequest(request);
}

function renderModelSelect() {
  const select = $("#modelSelect");
  if (!select) return;
  const options = sortedModels(state.models)
    .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.displayName)} · ${escapeHtml(model.category)}</option>`)
    .join("");
  select.innerHTML = options;
  select.value = state.selectedId;
}

function render() {
  $(".workspace")?.classList.toggle("is-playground-open", state.playgroundOpen);
  $("#playgroundBackdrop")?.toggleAttribute("hidden", !state.playgroundOpen);
  document.body.classList.toggle("modal-open", state.playgroundOpen);
  renderCounts();
  renderModels();
  renderModelSelect();
  updatePlayground();
}

function openPlayground(modelId) {
  state.selectedId = modelId;
  state.playgroundOpen = true;
  $(".workspace")?.classList.add("is-playground-open");
  $("#playgroundBackdrop")?.removeAttribute("hidden");
  document.body.classList.add("modal-open");
  renderModels();
  renderModelSelect();
  updatePlayground();
  requestAnimationFrame(() => $("#promptInput")?.focus({ preventScroll: true }));
}

function closePlayground() {
  if (state.running) return;
  state.playgroundOpen = false;
  $(".workspace")?.classList.remove("is-playground-open");
  $("#playgroundBackdrop")?.setAttribute("hidden", "");
  document.body.classList.remove("modal-open");
  renderModels();
}

function resultTextForCopy() {
  const result = $("#resultBox");
  if (!result) return "";
  const content = result.querySelector(".response-copy-content");
  return content ? content.innerText.trim() : "";
}

function updateResponseCopyState() {
  const button = $("#copyResponse");
  if (!button) return;
  button.disabled = !resultTextForCopy();
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      // Some browser contexts expose navigator.clipboard but still reject writes.
    }
  }

  if (typeof document.execCommand !== "function") {
    throw new Error("Copy command unavailable");
  }

  let copied = false;
  const copyHandler = (event) => {
    event.clipboardData?.setData("text/plain", text);
    event.preventDefault();
    copied = true;
  };
  document.addEventListener("copy", copyHandler);
  try {
    copied = document.execCommand("copy") || copied;
  } finally {
    document.removeEventListener("copy", copyHandler);
  }
  if (copied) return;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  document.body.append(textarea);
  let textareaCopied = false;
  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    textareaCopied = document.execCommand("copy");
  } finally {
    textarea.remove();
  }
  if (!textareaCopied) throw new Error("Copy command failed");
}

function setResult(html) {
  const result = $("#resultBox");
  if (!result) return;
  result.innerHTML = html;
  updateResponseCopyState();
}

function setRunStatus(message, type = "") {
  const node = $("#runStatus");
  if (!node) return;
  node.textContent = message;
  node.className = `run-status ${type}`.trim();
}

function setRunning(isRunning, message = "") {
  state.running = isRunning;
  const button = $("#runPlayground");
  if (button) {
    button.disabled = isRunning;
    button.textContent = isRunning ? "Generating..." : "Run request";
    button.setAttribute("aria-busy", String(isRunning));
  }
  if ($("#resetPlayground")) $("#resetPlayground").disabled = isRunning;
  if ($("#closePlayground")) $("#closePlayground").disabled = isRunning;
  if (message) setRunStatus(message, isRunning ? "busy" : "");
}

function generationMessage(detail = "Waiting for the API response.") {
  const lines = String(detail)
    .split(/\r?\n/)
    .map((line) => escapeHtml(line))
    .join("<br>");
  return `
    <div class="generation-state" aria-live="polite">
      <strong>Generating...</strong>
      <p>${lines}</p>
    </div>
  `;
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function friendlyError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/failed to fetch|load failed|network/i.test(message)) {
    return "Browser request was blocked or the network is unavailable. Confirm that the API allows this page origin for OPTIONS and CORS on the selected endpoint.";
  }
  return message;
}

function textFromValue(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === "string") return part;
        return part?.text || part?.content || "";
      })
      .join("");
  }
  return String(value);
}

function firstChoiceMessage(json) {
  const choice = json.choices?.[0];
  return {
    choice,
    message: choice?.message || choice?.delta || {}
  };
}

function readFinalContent(json) {
  const { choice, message } = firstChoiceMessage(json);
  return textFromValue(message.content || choice?.text);
}

function readReasoningContent(json) {
  const { choice, message } = firstChoiceMessage(json);
  const providerFields = message.provider_specific_fields || {};
  return textFromValue(
    message.reasoning_content ||
      providerFields.reasoning_content ||
      providerFields.reasoning?.content ||
      choice?.reasoning_content
  );
}

function reasoningTokenCount(json) {
  return json?.usage?.completion_tokens_details?.reasoning_tokens || json?.usage?.reasoning_tokens || 0;
}

function thinkingHtml(reasoning, requested = false, json = null) {
  if (!reasoning && !requested) return "";
  const tokens = reasoningTokenCount(json);
  const fallback = tokens
    ? `Thinking mode was enabled. The API returned ${tokens} reasoning tokens, but did not return reasoning_content text.`
    : "Thinking mode was enabled. The API did not return reasoning_content text.";
  return `<div class="thinking-output"><strong>Thinking</strong><pre>${escapeHtml(reasoning || fallback)}</pre></div>`;
}

function responseContentHtml(content, label = "Response") {
  if (!content) return "";
  return `<div class="response-copy-source"><strong>${escapeHtml(label)}</strong><pre class="response-copy-content">${escapeHtml(content)}</pre></div>`;
}

function usageHtml(json) {
  const parts = [];
  if (json.usage) parts.push(`<strong>Usage</strong><pre>${escapeHtml(JSON.stringify(json.usage, null, 2))}</pre>`);
  if (json.cost) parts.push(`<strong>Cost</strong><pre>${escapeHtml(JSON.stringify(json.cost, null, 2))}</pre>`);
  return parts.join("");
}

function absoluteUrl(value) {
  try {
    return new URL(value, mediaBase()).href;
  } catch {
    return value;
  }
}

function publicFileUrl(path) {
  return absoluteUrl(`/api/native${path}`);
}

function mediaUrlCandidates(value) {
  if (!value) return [];
  const text = String(value);
  if (/^(data|blob):/i.test(text)) return [text];

  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      if (url.pathname.startsWith("/files/")) {
        return [publicFileUrl(`${url.pathname}${url.search}${url.hash}`)];
      }
    } catch {
      return [text];
    }
    return [text];
  }

  if (text.startsWith("/api/")) return [absoluteUrl(text)];
  if (text.startsWith("/files/")) return [publicFileUrl(text)];
  if (text.startsWith("/v1/")) {
    return [
      absoluteUrl(`/api/native${text}`),
      absoluteUrl(text)
    ];
  }
  if (text.startsWith("/outputs/")) {
    return [
      absoluteUrl(`/api/native${text}`),
      absoluteUrl(text)
    ];
  }
  if (text.startsWith("/")) return [absoluteUrl(text)];
  return [];
}

function inferMediaType(value, key, category) {
  const text = String(value || "").toLowerCase();
  const name = String(key || "").toLowerCase();
  if (/^data:image\//.test(text) || /\.(png|jpe?g|webp|gif)(\?|$)/.test(text) || /image|thumbnail|cover/.test(name)) return "image";
  if (/^data:audio\//.test(text) || /\.(mp3|wav|m4a|flac|ogg)(\?|$)/.test(text) || /audio|music/.test(name)) return "audio";
  if (/^data:video\//.test(text) || /\.(mp4|webm|mov)(\?|$)/.test(text) || /video/.test(name)) return "video";
  if (category === "music") return "audio";
  if (category === "video") return "video";
  return category === "image" ? "image" : "download";
}

function collectMediaEntries(value, category, key = "", found = []) {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    const keyLower = String(key || "").toLowerCase();
    const looksLikeMedia =
      /^data:(image|audio|video)\//.test(lower)
      || /^blob:/.test(lower)
      || /^https?:\/\//.test(lower)
      || /\/(v1|outputs)\//.test(lower)
      || /\/files\//.test(lower)
      || /\.(png|jpe?g|webp|gif|mp3|wav|m4a|flac|ogg|mp4|webm|mov)(\?|$)/.test(lower)
      || /url|uri|href|audio|video|image|thumbnail|cover/.test(keyLower);

    if (looksLikeMedia && !/^\/sgl-workspace\//.test(value)) {
      mediaUrlCandidates(value).forEach((url) => {
        found.push({ type: inferMediaType(value, key, category), url });
      });
    }
    return found;
  }
  if (!value || typeof value !== "object") return found;
  Object.entries(value).forEach(([childKey, item]) => collectMediaEntries(item, category, childKey, found));
  return found;
}

function uniqueMediaEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.type}:${entry.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function downloadName(type, index, url) {
  const extension = url.match(/\.(png|jpe?g|webp|gif|mp3|wav|m4a|flac|ogg|mp4|webm|mov)(?:\?|$)/i)?.[1];
  const fallback = type === "video" ? "mp4" : type === "audio" ? "mp3" : type === "image" ? "png" : "bin";
  return `freyr-${type}-${index + 1}.${extension || fallback}`;
}

function mediaDownloadButton(entry, index) {
  const label = entry.type === "video" ? "Download video" : entry.type === "audio" ? "Download audio" : entry.type === "image" ? "Download image" : "Download file";
  return `<button class="button secondary" type="button" data-download-url="${escapeHtml(entry.url)}" data-download-name="${escapeHtml(downloadName(entry.type, index, entry.url))}">${label}</button>`;
}

function freyrOutputEntries(json, category) {
  const output = json?.freyr_output;
  if (!output || !Array.isArray(output.urls)) return [];
  return output.urls.flatMap((url) =>
    mediaUrlCandidates(url).map((candidate) => ({
      type: inferMediaType(url, output.media_type || "freyr_output", category),
      url: candidate
    }))
  );
}

function previewLabel(type) {
  if (type === "image") return "image";
  if (type === "audio") return "audio";
  if (type === "video") return "video";
  return "media";
}

function previewElementMarkup(entry, safeUrl, extraAttrs = "") {
  if (entry.type === "image") return `<img class="media-preview" alt="Generated image" src="${safeUrl}"${extraAttrs}>`;
  if (entry.type === "audio") return `<audio class="media-preview" controls src="${safeUrl}"${extraAttrs}></audio>`;
  if (entry.type === "video") return `<video class="media-preview" controls preload="metadata" src="${safeUrl}"${extraAttrs}></video>`;
  return "";
}

function videoDefaultSize(model) {
  return model?.defaultVideoSize || "512x512";
}

function videoDefaultFps(model) {
  return model?.defaultVideoFps || 8;
}

function videoDefaultDurationValue(model) {
  return model?.usesVideoSeconds ? model?.defaultVideoSeconds || 4 : model?.defaultVideoFrames || 9;
}

function videoDefaultSteps(model) {
  return model?.defaultVideoSteps || 1;
}

function videoDurationLabel(model) {
  return model?.usesVideoSeconds ? "Seconds" : "Frames";
}

function mediaGenerationStatusDetail(json, entries) {
  const status = typeof json?.status === "string" ? json.status : "";
  if (!status || /complete|completed|succeeded|success/i.test(status)) return "";

  const parts = [`Backend returned status "${status}".`];
  if (typeof json.progress === "number") parts.push(`Progress: ${json.progress}%.`);
  if (json.id) parts.push(`Job id: ${json.id}.`);
  if (json.error) {
    const errorText = typeof json.error === "string" ? json.error : JSON.stringify(json.error);
    parts.push(`Backend error: ${errorText}.`);
  }
  if (entries?.[0]?.url) parts.push(`Waiting for output file: ${entries[0].url}`);
  return parts.join("\n");
}

function mediaPreviewMarkup(entry) {
  const safeUrl = escapeHtml(entry.url);
  const directPreview = previewElementMarkup(entry, safeUrl);
  if (directPreview) return directPreview;

  return `
    <div class="media-frame">
      <span class="media-status">Preview unavailable. Use Download to fetch this ${escapeHtml(previewLabel(entry.type))}.</span>
    </div>
  `;
}

function mediaItemMarkup(entry, index) {
  return `
    <div class="media-item">
      ${mediaPreviewMarkup(entry)}
      <div class="media-actions">
        ${mediaDownloadButton(entry, index)}
      </div>
    </div>
  `;
}

function imageDataEntries(json) {
  const items = Array.isArray(json?.data) ? json.data : [];
  const images = items
    .map((item) => item.b64_json ? `data:image/png;base64,${item.b64_json}` : item.url)
    .filter(Boolean);
  return uniqueMediaEntries(images.flatMap((url) =>
    mediaUrlCandidates(url).map((candidate) => ({ type: "image", url: candidate }))
  ));
}

function mediaEntriesForJson(json, category) {
  const outputEntries = uniqueMediaEntries(freyrOutputEntries(json, category));
  if (outputEntries.length) return outputEntries;

  if (category === "image") {
    const entries = imageDataEntries(json);
    if (entries.length) return entries;
  }

  return uniqueMediaEntries(collectMediaEntries(json, category));
}

function renderMedia(json, category) {
  const entries = mediaEntriesForJson(json, category);
  if (!entries.length) return "";
  return `<div class="media-output">${entries.map((entry, index) => mediaItemMarkup(entry, index)).join("")}</div>`;
}

function cacheBustedUrl(value) {
  if (/^(data|blob):/i.test(value)) return value;
  try {
    const url = new URL(value, mediaBase());
    url.searchParams.set("_freyr_wait", String(Date.now()));
    return url.href;
  } catch {
    return value;
  }
}

function probeWithElement(entry) {
  if (/^data:/i.test(entry.url)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`${previewLabel(entry.type)} is not ready yet.`));
    }, MEDIA_POLL_PROBE_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeout);
      if (element) {
        element.onload = null;
        element.onerror = null;
        element.onloadedmetadata = null;
        element.oncanplay = null;
        element.src = "";
      }
    };

    let element;
    if (entry.type === "image") {
      element = new Image();
      element.onload = () => {
        cleanup();
        resolve();
      };
      element.onerror = () => {
        cleanup();
        reject(new Error("image is not ready yet."));
      };
      element.src = cacheBustedUrl(entry.url);
      return;
    }

    if (entry.type === "audio" || entry.type === "video") {
      element = document.createElement(entry.type);
      element.preload = "metadata";
      element.onloadedmetadata = () => {
        cleanup();
        resolve();
      };
      element.oncanplay = () => {
        cleanup();
        resolve();
      };
      element.onerror = () => {
        cleanup();
        reject(new Error(`${entry.type} is not ready yet.`));
      };
      element.src = cacheBustedUrl(entry.url);
      element.load();
      return;
    }

    cleanup();
    resolve();
  });
}

async function waitForMediaEntry(entry, index, total, statusDetail = "") {
  if (/^(data|blob):/i.test(entry.url) || entry.type === "download") return;

  const startedAt = Date.now();
  let attempt = 1;
  while (Date.now() - startedAt < MEDIA_POLL_TIMEOUT_MS) {
    const label = `${previewLabel(entry.type)} ${index + 1}/${total}`;
    setRunStatus(`Generating... waiting for ${label}`, "busy");
    const detail = [
      statusDetail,
      `Polling output URL for ${label}. Attempt ${attempt}.`
    ].filter(Boolean).join("\n");
    setResult(generationMessage(detail));
    try {
      await probeWithElement(entry);
      return;
    } catch {
      attempt += 1;
      await delay(MEDIA_POLL_INTERVAL_MS);
    }
  }

  throw new Error(`Timed out waiting for generated ${previewLabel(entry.type)} URL: ${entry.url}`);
}

function rawVideoJobId(value) {
  const text = String(value || "");
  if (!text.startsWith("video_")) return "";
  try {
    let encoded = text.slice("video_".length).replaceAll("-", "+").replaceAll("_", "/");
    encoded += "=".repeat((4 - (encoded.length % 4)) % 4);
    const decoded = window.atob(encoded);
    return decoded.match(/(?:^|;)video_id:([^;]+)/)?.[1] || "";
  } catch {
    return "";
  }
}

function withDerivedVideoOutput(json, model) {
  if (mediaEntriesForJson(json, "video").length || !model?.outputSlug) return json;
  const videoId = rawVideoJobId(json?.id);
  if (!videoId) return json;
  return {
    ...json,
    freyr_output: {
      media_type: "video",
      urls: [`/files/videos/${model.outputSlug}/${videoId}.mp4`]
    }
  };
}

async function waitForVideoJob(json, model) {
  let current = json;
  const initialStatus = String(current?.status || "");
  if (!current?.id || /complete|completed|succeeded|success/i.test(initialStatus)) {
    return withDerivedVideoOutput(current, model);
  }
  if (/failed|cancelled|canceled/i.test(initialStatus)) {
    throw new Error(`Video generation ${initialStatus}: ${JSON.stringify(current.error || current)}`);
  }

  const startedAt = Date.now();
  let attempt = 1;
  while (Date.now() - startedAt < MEDIA_POLL_TIMEOUT_MS) {
    setRunStatus(`Generating... checking video job (${attempt})`, "busy");
    setResult(generationMessage(mediaGenerationStatusDetail(current, [])));
    await delay(MEDIA_POLL_INTERVAL_MS);
    current = await fetchJson(`${endpointUrl(model)}/${encodeURIComponent(current.id)}`, {
      headers: playgroundHeaders(false),
      cache: "no-store"
    });
    const status = String(current?.status || "");
    if (/failed|cancelled|canceled/i.test(status)) {
      throw new Error(`Video generation ${status}: ${JSON.stringify(current.error || current)}`);
    }
    if (/complete|completed|succeeded|success/i.test(status)) {
      return withDerivedVideoOutput(current, model);
    }
    attempt += 1;
  }
  throw new Error(`Timed out waiting for video job: ${current?.id || json.id}`);
}

async function waitForMediaOutputs(json, model) {
  const category = model.category;
  if (category === "text") return json;
  const finalJson = category === "video" ? await waitForVideoJob(json, model) : json;
  const entries = mediaEntriesForJson(finalJson, category);
  const statusDetail = mediaGenerationStatusDetail(finalJson, entries);
  if (!entries.length) {
    if (statusDetail) setResult(generationMessage(statusDetail));
    return finalJson;
  }

  for (let index = 0; index < entries.length; index += 1) {
    await waitForMediaEntry(entries[index], index, entries.length, statusDetail);
  }
  return finalJson;
}

function downloadMedia(url, filename, button) {
  const previous = button.textContent;
  button.textContent = "Opening...";
  button.disabled = true;
  button.removeAttribute("title");
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  if (!/^data:/i.test(url)) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
  anchor.click();
  window.setTimeout(() => {
    button.textContent = previous;
    button.disabled = false;
  }, 800);
}

async function readStream(response, thinkingRequested = false) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  let reasoning = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        reasoning += readReasoningContent(json);
        output += readFinalContent(json);
        setResult([
          thinkingHtml(reasoning, thinkingRequested, json),
          responseContentHtml(output, "Streaming response"),
          usageHtml(json)
        ].filter(Boolean).join(""));
      } catch {
        output += data;
        setResult(responseContentHtml(output, "Streaming response"));
      }
    }
  }

  return output || reasoning;
}

function mediaTypeForResponse(response, model) {
  const contentType = response.headers.get("content-type") || "";
  const lower = contentType.toLowerCase();
  if (/json|text\/event-stream/.test(lower)) return "";
  if (lower.startsWith("image/")) return "image";
  if (lower.startsWith("audio/")) return "audio";
  if (lower.startsWith("video/")) return "video";
  return model.binaryResponseType || "";
}

function numericResponseHeader(response, name) {
  const value = Number(response.headers.get(name));
  return Number.isFinite(value) ? value : null;
}

function objectWithValues(value) {
  return Object.keys(value).length ? value : null;
}

async function binaryMediaJson(response, model, mediaType) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const outputSeconds = numericResponseHeader(response, "x-freyr-output-seconds");
  const usageUnits = numericResponseHeader(response, "x-freyr-usage-units");
  const totalCost = numericResponseHeader(response, "x-freyr-total-cost");
  const usage = objectWithValues({
    type: response.headers.get("x-freyr-usage-type") || mediaType,
    ...(outputSeconds === null ? {} : { output_seconds: outputSeconds }),
    ...(usageUnits === null ? {} : { usage_units: usageUnits })
  });
  const cost = objectWithValues(totalCost === null ? {} : { total_cost: totalCost });

  return {
    model: response.headers.get("x-freyr-model") || model.id,
    freyr_output: {
      media_type: mediaType,
      storage: "browser_blob",
      urls: [url]
    },
    ...(usage ? { usage } : {}),
    ...(cost ? { cost } : {})
  };
}

async function runPlayground() {
  if (state.running) return;
  state.headerText = $("#authHeaders")?.value || "";
  localStorage.setItem(HEADERS_STORAGE_KEY, state.headerText);
  const model = selectedModel();
  const request = buildRequest();
  if (!model || !request) return;

  const headers = parseHeaderLines(state.headerText);
  if (!headerValue(headers, "authorization")) {
    setResult("Add an Authorization header before running the playground. Headers are saved per website domain, so re-enter them on www.freyrtech.ai if you previously saved them on another domain.");
    return;
  }

  if (model.requiresReference && !$("#referenceImage")?.files?.[0]) {
    setResult(`This model requires a ${model.referenceLabel || "reference file"}. Choose a file before running the request.`);
    return;
  }

  setRunning(true, "Generating...");
  setResult(generationMessage("Request is running. The response will appear here when generation completes."));

  try {
    if (request.kind === "form") {
      const reference = request.body.get("input_reference");
      if (reference instanceof File) {
        const optimized = await optimizeReferenceImage(reference);
        if (optimized.changed) {
          request.body.set("input_reference", optimized.file, optimized.file.name);
          setResult(generationMessage(`Optimized reference image from ${formatBytes(reference.size)} to ${formatBytes(optimized.file.size)}. Calling model API...`));
        } else {
          setResult(generationMessage("Calling model API..."));
        }
      } else {
        setResult(generationMessage("Calling model API..."));
      }
    } else {
      setResult(generationMessage("Calling model API..."));
    }

    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.kind === "json" ? JSON.stringify(request.body) : request.body
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(detail || `Request failed with status ${response.status}`);
    }

    if (model.category === "text" && request.body.stream) {
      setRunStatus("Streaming...", "busy");
      const thinkingRequested = model.supportsReasoningToggle && Boolean($("#reasoningMode")?.checked);
      const output = await readStream(response, thinkingRequested);
      if (!output) setResult("Stream completed without text content.");
      setRunStatus("Complete", "complete");
      return;
    }

    const directMediaType = mediaTypeForResponse(response, model);
    if (directMediaType) {
      setRunStatus("Preparing preview...", "busy");
      const json = await binaryMediaJson(response, model, directMediaType);
      const media = renderMedia(json, model.category);
      setRunStatus("Complete", "complete");
      setResult([
        media ? `<div class="response-copy-source">${media}</div>` : "",
        usageHtml(json),
        `<strong>Raw JSON</strong><pre>${escapeHtml(JSON.stringify(json, null, 2))}</pre>`
      ].filter(Boolean).join(""));
      return;
    }

    let json = await response.json();
    json = await waitForMediaOutputs(json, model);
    const reasoning = readReasoningContent(json);
    const content = readFinalContent(json);
    const thinkingRequested = model.category === "text" && model.supportsReasoningToggle && Boolean($("#reasoningMode")?.checked);
    const media = renderMedia(json, model.category);
    const responseMarkup = [
      content ? `<strong>Response</strong><pre class="response-copy-content">${escapeHtml(content)}</pre>` : "",
      media
    ].filter(Boolean).join("");
    setRunStatus("Complete", "complete");
    setResult([
      thinkingHtml(reasoning, thinkingRequested, json),
      responseMarkup ? `<div class="response-copy-source">${responseMarkup}</div>` : "",
      usageHtml(json),
      `<strong>Raw JSON</strong><pre>${escapeHtml(JSON.stringify(json, null, 2))}</pre>`
    ].filter(Boolean).join(""));
  } catch (error) {
    setRunStatus("Failed", "error");
    setResult(`<strong>Request failed</strong><pre>${escapeHtml(friendlyError(error))}</pre>`);
  } finally {
    setRunning(false);
  }
}

function resetPlayground() {
  state.lastPromptCategory = "";
  state.lastImageParamModel = "";
  state.lastVideoParamModel = "";
  $("#systemPrompt").value = "You are a concise AI infrastructure assistant.";
  $("#maxTokens").value = "256";
  $("#temperature").value = "0.2";
  $("#topP").value = "0.9";
  $("#streamResponse").checked = false;
  $("#reasoningMode").checked = false;
  $("#imageSize").value = "1024x1024";
  $("#imageCountInput").value = "2";
  $("#imageSteps").value = "10";
  $("#videoSize").value = "512x512";
  $("#videoFps").value = "8";
  $("#videoFrames").value = "9";
  $("#videoSteps").value = "1";
  $("#musicTags").value = "ambient, cinematic";
  $("#musicLength").value = "1000";
  $("#musicTemperature").value = "0.8";
  $("#musicTopK").value = "50";
  $("#musicCfg").value = "4";
  if ($("#referenceImage")) $("#referenceImage").value = "";
  setResult("Ready.");
  setRunStatus("Ready");
  updatePlayground();
}

function bindEvents() {
  $("#authHeaders").value = state.headerText;

  $("#accessForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.headerText = $("#authHeaders").value;
    localStorage.setItem(HEADERS_STORAGE_KEY, state.headerText);
    loadModels({ authorized: true });
  });

  $("#clearHeaders").addEventListener("click", () => {
    state.headerText = "";
    $("#authHeaders").value = "";
    localStorage.removeItem(HEADERS_STORAGE_KEY);
    updatePlayground();
  });

  $$(".segmented button").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category || "all";
      $$(".segmented button").forEach((item) => item.classList.toggle("active", item === button));
      renderModels();
    });
  });

  $$("[data-preview-format]").forEach((button) => {
    button.addEventListener("click", () => {
      state.previewFormat = button.dataset.previewFormat || "curl";
      $$("[data-preview-format]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      updatePlayground();
    });
  });

  $("#searchModels").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderModels();
  });

  $("#sortModels").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderModels();
    renderModelSelect();
  });

  $("#modelGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-model]");
    if (!button) return;
    openPlayground(button.dataset.selectModel);
  });

  $("#modelSelect").addEventListener("change", (event) => {
    state.selectedId = event.target.value;
    state.playgroundOpen = true;
    $(".workspace")?.classList.add("is-playground-open");
    $("#playgroundBackdrop")?.removeAttribute("hidden");
    document.body.classList.add("modal-open");
    renderModels();
    updatePlayground();
  });

  $("#closePlayground")?.addEventListener("click", closePlayground);
  $("#playgroundBackdrop")?.addEventListener("click", closePlayground);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.playgroundOpen) closePlayground();
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-download-url]");
    if (!button) return;
    downloadMedia(button.dataset.downloadUrl, button.dataset.downloadName || "freyr-output.bin", button);
  });

  [
    "#promptInput",
    "#systemPrompt",
    "#maxTokens",
    "#temperature",
    "#topP",
    "#streamResponse",
    "#reasoningMode",
    "#imageSize",
    "#imageCountInput",
    "#imageSteps",
    "#videoSize",
    "#videoFps",
    "#videoFrames",
    "#videoSteps",
    "#referenceImage",
    "#musicTags",
    "#musicLength",
    "#musicTemperature",
    "#musicTopK",
    "#musicCfg"
  ].forEach((selector) => {
    const node = $(selector);
    node?.addEventListener("input", updatePlayground);
    node?.addEventListener("change", updatePlayground);
  });

  $("#runPlayground").addEventListener("click", runPlayground);
  $("#resetPlayground").addEventListener("click", resetPlayground);
  $("#copyRequest").addEventListener("click", async () => {
    await navigator.clipboard?.writeText($("#requestPreview").textContent);
    $("#copyRequest").textContent = "Copied";
    window.setTimeout(() => {
      $("#copyRequest").textContent = "Copy";
    }, 1200);
  });
  $("#copyResponse")?.addEventListener("click", async () => {
    const button = $("#copyResponse");
    const text = resultTextForCopy();
    if (!button || !text) return;

    try {
      await copyTextToClipboard(text);
      button.disabled = true;
      button.title = "Copied";
      button.setAttribute("aria-label", "Copied");
      window.setTimeout(() => {
        button.title = "Copy response";
        button.setAttribute("aria-label", "Copy response");
        updateResponseCopyState();
      }, 1200);
    } catch (error) {
      button.title = "Copy failed";
      window.setTimeout(() => {
        button.title = "Copy response";
      }, 1200);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  loadModels({ authorized: Boolean(state.headerText.trim()) });
});
