// ── Amazon Bedrock – direct REST API with bearer token ─────────────────────
// Uses the Bedrock long-term API key (AWS_BEARER_TOKEN_BEDROCK) via
// Authorization: Bearer header — no IAM credentials needed.
// Falls back to IAM SigV4 via the AWS SDK if no bearer token is set.
// ─────────────────────────────────────────────────────────────────────────────

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const REGION = process.env.AWS_REGION ?? "eu-north-1";

// Model ID confirmed from AWS Bedrock console → Model catalog → Claude Sonnet 4.6
// Inference type: Cross-region (Bedrock handles routing automatically via Converse API)
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

// ── Converse API helper (works with both bearer token and IAM) ────────────────
// The Converse API is the recommended endpoint for all Claude models on Bedrock.
// It supports both direct model IDs and cross-region inference profiles.
async function converseWithBearerToken(
  bearerToken: string,
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const endpoint = `https://bedrock-runtime.${REGION}.amazonaws.com/model/${encodeURIComponent(modelId)}/converse`;

  const conversePayload = {
    messages: [{ role: "user", content: [{ text: userPrompt }] }],
    system: [{ text: systemPrompt }],
    inferenceConfig: { maxTokens },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(conversePayload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Bedrock ${res.status}: ${errText}`);
  }

  const body = await res.json();
  return body?.output?.message?.content?.[0]?.text ?? "";
}

// ── IAM credentials path (fallback via AWS SDK ConverseCommand) ───────────────
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

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

async function converseWithIAM(modelId: string, systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const command = new ConverseCommand({
    modelId,
    messages: [{ role: "user", content: [{ text: userPrompt }] }],
    system: [{ text: systemPrompt }],
    inferenceConfig: { maxTokens },
  });
  const response = await getSdkClient().send(command);
  return response?.output?.message?.content?.[0]?.text ?? "";
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

  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const text = bearerToken
        ? await converseWithBearerToken(bearerToken, BEDROCK_MODEL, systemPrompt, userPrompt, maxTokens)
        : await converseWithIAM(BEDROCK_MODEL, systemPrompt, userPrompt, maxTokens);
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
