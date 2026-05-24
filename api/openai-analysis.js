export async function createCrystalAnalysis(data, options = {}) {
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
      body: { error: "Missing analysis data" },
    };
  }

  const model = options.model || process.env.OPENAI_MODEL || "gpt-4o";
  const fallbackModel = options.fallbackModel || process.env.OPENAI_FALLBACK_MODEL || "gpt-4-turbo";
  const prompt = buildAnalysisPrompt(data);
  const result = await requestOpenAI({ apiKey, model, prompt });

  if (!result.ok && fallbackModel && fallbackModel !== model && [403, 404].includes(result.status)) {
    const fallbackResult = await requestOpenAI({ apiKey, model: fallbackModel, prompt });
    return formatOpenAIResult(fallbackResult, fallbackModel, model);
  }

  return formatOpenAIResult(result, model);
}

async function requestOpenAI({ apiKey, model, prompt }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are Lunette AI Crystal Lab, a refined Traditional Chinese crystal recommendation assistant. Give thoughtful, elegant, practical analysis. Avoid medical, legal, or guaranteed fortune claims.",
            },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
      max_output_tokens: 1200,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await response.json(),
  };
}

function formatOpenAIResult(result, model, fallbackFrom = null) {
  if (!result.ok) {
    return {
      status: result.status,
      body: {
        error: result.body.error?.message || "OpenAI API request failed",
      },
    };
  }

  return {
    status: 200,
    body: {
      model,
      fallbackFrom,
      analysis: extractOutputText(result.body),
    },
  };
}

function buildAnalysisPrompt(data) {
  return `請根據以下使用者資料，產生一份繁體中文的個人命定水晶分析。

輸出格式：
1. 一段 80 字以內的氣質與能量總結
2. 推薦 3 種水晶，每種包含：水晶名稱、推薦原因、適合佩戴或擺放方式
3. 一句溫柔提醒

使用者資料：
${JSON.stringify(data, null, 2)}`;
}

function extractOutputText(result) {
  if (result.output_text) return result.output_text;

  return (result.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .join("\n")
    .trim();
}
