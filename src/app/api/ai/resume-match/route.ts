import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3.8-flash";

const PROMPT = `You are an expert ATS (Applicant Tracking System) analyst and resume reviewer. Compare the provided resume text against the job description and provide a detailed match analysis.

Return ONLY a valid JSON object:
{
  "score": 0-100 (integer, overall match percentage),
  "summary": "2-3 sentence summary of how well the resume matches",
  "matchedSkills": ["skills/keywords found in both resume and job description"],
  "missingSkills": ["important skills/keywords in the job description but NOT in the resume"],
  "suggestions": ["3-5 specific, actionable suggestions to improve the resume for this role"],
  "strengths": ["2-3 key strengths the candidate has for this role"]
}`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured." },
      { status: 500 }
    );
  }

  let body: { resumeText?: string; jobDescription?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { resumeText, jobDescription } = body;

  if (!resumeText || resumeText.trim().length < 50) {
    return NextResponse.json(
      { error: "Please paste your resume text (at least 50 characters)." },
      { status: 400 }
    );
  }

  if (!jobDescription || jobDescription.trim().length < 20) {
    return NextResponse.json(
      { error: "Please paste the job description (at least 20 characters)." },
      { status: 400 }
    );
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  PROMPT +
                  "\n\n--- RESUME ---\n" +
                  resumeText.slice(0, 8000) +
                  "\n\n--- JOB DESCRIPTION ---\n" +
                  jobDescription.slice(0, 5000),
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to analyze resume. Try again." },
        { status: 422 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      score: Math.min(100, Math.max(0, Number(result.score) || 0)),
      summary: String(result.summary || ""),
      matchedSkills: Array.isArray(result.matchedSkills)
        ? result.matchedSkills.map(String)
        : [],
      missingSkills: Array.isArray(result.missingSkills)
        ? result.missingSkills.map(String)
        : [],
      suggestions: Array.isArray(result.suggestions)
        ? result.suggestions.map(String)
        : [],
      strengths: Array.isArray(result.strengths)
        ? result.strengths.map(String)
        : [],
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to analyze resume.";
    console.error("Resume match error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
