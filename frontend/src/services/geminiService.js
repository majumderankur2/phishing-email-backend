// geminiService.js
// This calls your Flask backend (local in dev, Render in production)

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

export const analyzeEmailWithGemini = async (emailText) => {
  try {
    const response = await fetch(`${API_URL}/api/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_text: emailText,
        urls: [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    return {
      label:            capitaliseLabel(data.label),
      score:            data.score,
      confidence:       data.confidence,
      explanation:      data.explanation || "No explanation provided.",
      indicators:       data.indicators  || [],
      votes:            data.votes       || "",
      engine_breakdown: data.engine_breakdown || {},
    };

  } catch (error) {
    console.error("Backend connection error:", error);
    return {
      label:            "Error",
      score:            0,
      confidence:       0,
      explanation:      "Backend connection failed. Make sure Flask is running.",
      indicators:       [],
      votes:            "",
      engine_breakdown: {},
    };
  }
};

// Converts "phishing" → "Suspicious", "safe" → "Safe"
function capitaliseLabel(label) {
  if (!label) return "Unknown";
  const l = label.toLowerCase();
  if (l === "phishing" || l === "suspicious") return "Suspicious";
  if (l === "safe")                           return "Safe";
  return label.charAt(0).toUpperCase() + label.slice(1);
}