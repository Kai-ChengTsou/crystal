export async function createBraceletImage(data, analysis, options = {}) {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      status: 500,
      body: { error: "Missing OPENAI_API_KEY environment variable" },
    };
  }

  if (!data) {
    return {
      status: 400,
      body: { error: "Missing bracelet data" },
    };
  }

  const model = options.model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
  const fallbackModel = options.fallbackModel || process.env.OPENAI_IMAGE_FALLBACK_MODEL || "gpt-image-1";
  const crystals = inferBraceletCrystals(data, analysis);
  const prompt = buildBraceletPrompt(data, analysis, crystals);
  const result = await requestImage({ apiKey, model, prompt });

  if (!result.ok && fallbackModel && fallbackModel !== model && [403, 404].includes(result.status)) {
    const fallbackResult = await requestImage({ apiKey, model: fallbackModel, prompt });
    return formatImageResult(fallbackResult, fallbackModel, model, crystals);
  }

  return formatImageResult(result, model, null, crystals);
}

async function requestImage({ apiKey, model, prompt }) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      quality: "medium",
      n: 1,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await response.json(),
  };
}

function formatImageResult(result, model, fallbackFrom = null, crystals = []) {
  if (!result.ok) {
    return {
      status: result.status,
      body: {
        error: result.body.error?.message || "OpenAI image request failed",
      },
    };
  }

  const image = result.body.data?.[0] || {};
  const b64 = image.b64_json;

  return {
    status: 200,
    body: {
      model,
      fallbackFrom,
      crystals,
      image: b64 ? `data:image/png;base64,${b64}` : image.url || null,
      revisedPrompt: image.revised_prompt || null,
    },
  };
}

function buildBraceletPrompt(data, analysis = "", crystals = []) {
  const style = data.stylePreference?.title || "簡約高級感";
  const state = data.recentState?.title || "平衡療癒";
  const focus = data.basicInfo?.focusAreas?.join("、") || "能量平衡";
  const beadMaterials = crystals.join(", ");

  return `Create a premium product photo of a personalized crystal bracelet for a user.

User energy profile:
- Recent state: ${state}
- Focus areas: ${focus}
- Preferred style: ${style}
- AI analysis: ${analysis}

Image direction:
- A delicate natural crystal bracelet on a pale marble pedestal
- Use these exact crystal bead materials: ${beadMaterials}
- Elegant, soft, refined, luxury wellness product photography
- Soft cream and blush lighting unless the selected style suggests cooler tones
- Include subtle gold separators and one small star/moon charm if appropriate
- Clean background, shallow depth of field, no hands, no people, no text, no logo
- The bracelet should be clear and centered, suitable for an app result card`;
}

function inferBraceletCrystals(data = {}, analysis = "") {
  const knownNames = [
    "白水晶",
    "粉晶",
    "紫水晶",
    "黑曜石",
    "茶晶",
    "黃水晶",
    "月光石",
    "海藍寶",
    "綠幽靈",
    "虎眼石",
    "拉長石",
    "草莓晶",
    "碧璽",
    "石榴石",
    "葡萄石",
    "青金石",
    "天河石",
    "瑪瑙",
  ];
  const matches = knownNames.filter((name) => analysis.includes(name));
  if (matches.length) return [...new Set(matches)].slice(0, 4);

  const profile = [
    data.basicInfo?.focusAreas?.join(" "),
    data.recentState?.title,
    data.recentState?.description,
    data.stylePreference?.title,
  ]
    .filter(Boolean)
    .join(" ");
  const selected = [];
  const add = (...names) => {
    names.forEach((name) => {
      if (!selected.includes(name)) selected.push(name);
    });
  };

  if (/愛|關係|人緣|情感|桃花/.test(profile)) add("粉晶", "草莓晶");
  if (/焦慮|壓力|睡眠|平靜|療癒|情緒/.test(profile)) add("紫水晶", "海藍寶", "葡萄石");
  if (/事業|工作|財|金錢|成長/.test(profile)) add("綠幽靈", "黃水晶", "虎眼石");
  if (/保護|防護|低潮|迷惘|穩定/.test(profile)) add("黑曜石", "茶晶");
  if (/改變|轉換|直覺|靈感/.test(profile)) add("拉長石", "月光石");
  if (/溝通|表達/.test(profile)) add("青金石", "天河石");
  add("白水晶", "紫水晶", "黑曜石");

  return selected.slice(0, 3);
}
