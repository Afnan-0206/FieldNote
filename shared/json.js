/**
 * Safely extracts and parses JSON from raw LLM text output.
 * Handles markdown code fences, leading commentary, and trailing tokens.
 * Pure JavaScript with zero runtime dependencies.
 */
export function extractJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty or invalid output from AI model.');
  }

  const trimmed = rawText.trim();

  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue to extract substring
  }

  // Check for markdown code fences ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Fall through to brace finder
    }
  }

  // Find opening and closing curly braces
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (err) {
      throw new Error(`Failed to parse extracted JSON candidate from model: ${err.message}`, { cause: err });
    }
  }

  throw new Error('Model output did not contain a valid JSON object.');
}
