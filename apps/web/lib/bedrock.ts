import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// ── Authentication ─────────────────────────────────────────────────────────────
// Supports both:
//   1. Bedrock long-term API key  →  set AWS_BEARER_TOKEN_BEDROCK
//   2. IAM credentials           →  set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
//
// The Bedrock API key (bearer token) is the recommended approach for the
// Amazon Bedrock console-generated "long-term API key".
// ─────────────────────────────────────────────────────────────────────────────

const REGION = process.env.AWS_REGION ?? "eu-north-1"; // Europe (Stockholm)

// Claude model IDs:
// - EU cross-region inference prefix:  eu.anthropic.claude-3-5-sonnet-20241022-v2:0
// - US cross-region inference prefix:  us.anthropic.claude-3-5-sonnet-20241022-v2:0
// - Direct (us-east-1 only):           anthropic.claude-3-5-sonnet-20241022-v2:0
// For Stockholm (eu-north-1) you must use the EU cross-region profile.
export const BEDROCK_MODEL =
  process.env.BEDROCK_MODEL ?? "eu.anthropic.claude-3-5-sonnet-20241022-v2:0";

function buildClient(): BedrockRuntimeClient {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;

  if (bearerToken) {
    // Bedrock long-term API key — bearer token auth
    return new BedrockRuntimeClient({
      region: REGION,
      token: { token: bearerToken },
    });
  }

  // Fallback: IAM credentials
  return new BedrockRuntimeClient({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

const client = buildClient();

function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message + (error.name ?? "");
  return (
    msg.includes("ThrottlingException") ||
    msg.includes("ServiceUnavailableException") ||
    msg.includes("TooManyRequestsException") ||
    msg.includes("503") ||
    msg.includes("429")
  );
}

export function friendlyBedrockError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message + (error.name ?? "");
    if (msg.includes("ThrottlingException") || msg.includes("TooManyRequests")) {
      return "AI is experiencing high demand. Please try again in a moment.";
    }
    if (msg.includes("ServiceUnavailable") || msg.includes("503")) {
      return "AI service temporarily unavailable. Please try again.";
    }
    if (
      msg.includes("AccessDeniedException") ||
      msg.includes("credentials") ||
      msg.includes("UnrecognizedClientException") ||
      msg.includes("InvalidSignatureException")
    ) {
      return "AI service authentication error. Please check your API key in settings.";
    }
    if (msg.includes("ValidationException")) {
      return "Invalid request to AI service. Please try again.";
    }
    if (msg.includes("ModelNotReadyException") || msg.includes("model access")) {
      return "Claude model not enabled. Please request Bedrock model access in the AWS console.";
    }
  }
  return "AI generation failed. Please try again.";
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call Claude on Bedrock with retry + exponential backoff.
 * Returns the text response.
 */
export async function claudeGenerate(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048
): Promise<string> {
  const MAX_RETRIES = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      };

      const command = new InvokeModelCommand({
        modelId: BEDROCK_MODEL,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
      });

      const response = await client.send(command);
      const body = JSON.parse(new TextDecoder().decode(response.body));
      return body?.content?.[0]?.text ?? "";
    } catch (err) {
      lastError = err;
      if (isRetryable(err) && attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(
          `[bedrock] attempt ${attempt + 1} failed (retryable), retrying in ${delay}ms…`
        );
        await sleep(delay);
        continue;
      }
      break;
    }
  }

  throw lastError;
}
