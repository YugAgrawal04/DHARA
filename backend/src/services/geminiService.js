import { config } from '../config/env.js';
import { fetchJson } from '../utils/fetchJson.js';
import { HttpError } from '../utils/httpError.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function buildPrompt(s) {
  const interventions = s.interventions.length
    ? s.interventions.map((i) => `${i.title}: ${i.value}% intensity, ${i.count} deployment(s)`).join(', ')
    : 'None';

  return `You are an environmental analyst. Generate a report for ${s.location}.
Today's date is ${new Date().toLocaleDateString('en-IN')}.
IMPORTANT: Do not generate a random date in the header of the report.

Current AQI: ${s.currentAQI.value} (${s.currentAQI.category}).
Projected AQI: ${s.projectedAQI.value} (${s.projectedAQI.category}).
CO2 Change: ${s.co2Change}.
Interventions: ${interventions}.
Provide 3 bullet points on health and 3 on policy.`;
}

/** Sends the current simulation scenario to Gemini and returns the report text. */
export async function generateReport(scenario) {
  if (!config.geminiKey) {
    throw new HttpError(503, 'AI report is not configured: set GEMINI_API_KEY in backend/.env');
  }

  const url = `${BASE_URL}/${encodeURIComponent(config.geminiModel)}:generateContent`;
  let data;
  try {
    data = await fetchJson(url, {
      method: 'POST',
      timeoutMs: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.geminiKey, // key stays on the server
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(scenario) }] }] }),
    });
  } catch (err) {
    throw new HttpError(502, `Gemini request failed: ${err.message}`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  if (!text) throw new HttpError(502, 'Gemini returned an empty response');

  return { report: text, model: config.geminiModel, generatedAt: new Date().toISOString() };
}
