// ── Amazon Bedrock – direct REST API with bearer token ─────────────────────
// Uses the Bedrock long-term API key (AWS_BEARER_TOKEN_BEDROCK) via
// Authorization: Bearer header — no IAM credentials needed.
// Falls back to IAM SigV4 via the AWS SDK if no bearer token is set.
// ─────────────────────────────────────────────────────────────────────────────

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// eu-north-1 (Stockholm) — confirmed working model from Roo Code settings.
const REGION = process.env.AWS_REGION ?? "eu-north-1";

// anthropic.claude-sonnet-4-6 confirmed available in eu-north-1 via Bedrock API key.
export const BEDROCK_MODEL =
  process.env.BEDROCK_MODEL ?? "anthropic.claude-sonnet-4-6";

function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message + (error.name ?? "");
  return (
    msg.includes("ThrottlingException") ||
    msg.includes("ServiceUnavailableException") ||
    msg.includes("TooManyRequestsException") ||
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("Too Many Requests")
  );
}

export function friendlyBedrockError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message + (error.name ?? "");
    if (msg.includes("ThrottlingException") || msg.includes("TooManyRequests") || msg.includes("429")) {
      return "AI is experiencing high demand. Please try again in a moment.";
    }
    if (msg.includes("ServiceUnavailable") || msg.includes("503")) {
      return "AI service temporarily unavailable. Please try again.";
    }
    if (
      msg.includes("AccessDeniedException") ||
      msg.includes("UnrecognizedClientException") ||
      msg.includes("InvalidSignatureException") ||
      msg.includes("403") ||
      msg.includes("401")
    ) {
      return "AI service authentication error. Please check the AWS_BEARER_TOKEN_BEDROCK environment variable.";
    }
    if (
      msg.includes("ValidationException") ||
      msg.includes("ModelNotReadyException") ||
      msg.includes("ResourceNotFoundException")
    ) {
      return "AI model error. Try setting BEDROCK_MODEL to a different model ID in your Railway environment variables.";
    }
  }
  return "AI generation failed. Please try again.";
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Bearer token path (Bedrock long-term API key) ─────────────────────────────
async function invokeWithBearerToken(
  bearerToken: string,
  modelId: string,
  payload: object
): Promise<string> {
  const endpoint = `https://bedrock-runtime.${REGION}.amazonaws.com/model/${encodeURIComponent(modelId)}/invoke`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Bedrock ${res.status}: ${errText}`);
  }

  const body = await res.json();
  return body?.content?.[0]?.text ?? "";
}

// ── IAM credentials path (fallback) ──────────────────────────────────────────
let _sdkClient: BedrockRuntimeClient | null = null;
function getSdkClient(): BedrockRuntimeClient {
  if (!_sdkClient) {
    _sdkClient = new BedrockRuntimeClient({
      region: REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _sdkClient;
}

async function invokeWithIAM(modelId: string, payload: object): Promise<string> {
  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });
  const response = await getSdkClient().send(command);
  const body = JSON.parse(new TextDecoder().decode(response.body));
  return body?.content?.[0]?.text ?? "";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Call Claude on Bedrock with retry + exponential backoff.
 * Automatically picks bearer token or IAM credentials based on env vars.
 */
export async function claudeGenerate(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048
): Promise<string> {
  const MAX_RETRIES = 3;
  let lastError: unknown;

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  };

  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const text = bearerToken
        ? await invokeWithBearerToken(bearerToken, BEDROCK_MODEL, payload)
        : await invokeWithIAM(BEDROCK_MODEL, payload);
      return text;
    } catch (err) {
      lastError = err;
      if (isRetryable(err) && attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[bedrock] attempt ${attempt + 1} failed (retryable), retrying in ${delay}ms…`);
        await sleep(delay);
        continue;
      }
      console.error(`[bedrock] attempt ${attempt + 1} failed (non-retryable):`, err);
      break;
    }
  }

  throw lastError;
}
