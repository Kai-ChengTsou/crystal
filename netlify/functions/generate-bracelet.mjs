import { createBraceletImage } from "../../api/bracelet-image.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const result = await createBraceletImage(body.data, body.analysis);
    return jsonResponse(result.status, result.body);
  } catch (error) {
    console.error(error);
    return jsonResponse(500, { error: "Server error" });
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}
