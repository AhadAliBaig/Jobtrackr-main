export interface AIConfig {
  apiKey?: string;
  model?: string;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class AIService {
  private apiKey: string;
  private model: string;

  constructor(config: AIConfig = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || "";
    this.model = config.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Only log in development, not production
    if (process.env.NODE_ENV !== 'production' && this.apiKey) {
      console.log("[AIService] GEMINI_API_KEY configured");
    }

    if (!this.apiKey) {
      console.warn("[AIService] GEMINI_API_KEY is not set.");
    }
  }

  /**
   * Call Gemini and return clean text.
   */
  async callAI(prompt: string, systemMessage?: string): Promise<AIResponse> {
  if (!this.apiKey) {
    return { success: false, error: "GEMINI_API_KEY is not configured" };
  }

  const fullPrompt = systemMessage
    ? `${systemMessage}\n\n${prompt}`
    : prompt;

  try {
    const response = await fetch(
      // OLD:
      // `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      // NEW:
      `https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: fullPrompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("[AIService] Gemini error payload:", text);
      throw new Error(`Gemini error: ${response.status} - ${text}`);
    }

    const data: any = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      JSON.stringify(data);

    return { success: true, data: text };
  } catch (err: any) {
    console.error("[AIService] Gemini call failed:", err);
    return {
      success: false,
      error: err?.message || "Unknown Gemini error",
    };
  }
 }
}