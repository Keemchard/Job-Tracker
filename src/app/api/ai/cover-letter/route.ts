import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3.8-flash";

const PROMPT = `You are an expert cover letter writer. Write a professional, compelling cover letter based on the job details provided. The cover letter should:

1. Be addressed appropriately (use the contact person if provided, otherwise "Hiring Manager")
2. Have a strong opening that shows genuine interest in the role
3. Highlight relevant qualifications and enthusiasm for the position
4. Be concise (3-4 paragraphs) and professional
5. End with a call to action

Return ONLY a valid JSON object:
{
  "coverLetter": "the full cover letter text with proper paragraphs separated by \\n\\n",
  "tips": ["1-3 short tips for customizing this letter further"]
}`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured." },
      { status: 500 }
    );
  }

  let body: {
    company?: string;
    position?: string;
    location?: string;
    notes?: string;
    contactPerson?: string;
    userBackground?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { company, position, location, notes, contactPerson, userBackground } = body;

  if (!company || !position) {
    return NextResponse.json(
      { error: "Company and position are required." },
      { status: 400 }
    );
  }

  const jobContext = [
    `Company: ${company}`,
    `Position: ${position}`,
    location ? `Location: ${location}` : "",
    contactPerson ? `Contact Person: ${contactPerson}` : "",
    notes ? `Job Details: ${notes}` : "",
    userBackground ? `Applicant Background: ${userBackground}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: PROMPT + "\n\nJob Details:\n" + jobContext }] },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
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
        { error: "Failed to generate cover letter. Try again." },
        { status: 422 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      coverLetter: String(result.coverLetter || ""),
      tips: Array.isArray(result.tips) ? result.tips.map(String) : [],
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate cover letter.";
    console.error("Cover letter error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
