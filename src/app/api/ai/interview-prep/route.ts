import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3.8-flash";

const GENERATE_PROMPT = `You are an expert interview coach. Generate realistic interview questions for the given job position. Include a mix of behavioral, technical, and situational questions tailored to the role.

Return ONLY a valid JSON object:
{
  "questions": [
    {
      "question": "the interview question",
      "category": "behavioral" or "technical" or "situational",
      "difficulty": "easy" or "medium" or "hard",
      "tip": "a brief tip on how to approach this question"
    }
  ]
}

Generate exactly 8 questions with a good mix of categories and difficulties.`;

const EVALUATE_PROMPT = `You are an expert interview coach. Evaluate the candidate's answer to an interview question. Be encouraging but honest. Provide structured feedback.

Return ONLY a valid JSON object:
{
  "rating": 1-5 (integer, 1=poor, 5=excellent),
  "feedback": "2-3 sentences of specific feedback on the answer",
  "improvedAnswer": "a brief example of a stronger version of the answer (2-3 sentences)",
  "keyPoints": ["2-3 key points the answer should include"]
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
    action: "generate" | "evaluate";
    company?: string;
    position?: string;
    question?: string;
    answer?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action } = body;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    if (action === "generate") {
      const { company, position } = body;
      if (!position) {
        return NextResponse.json(
          { error: "Position is required." },
          { status: 400 }
        );
      }

      const context = `Position: ${position}${company ? `\nCompany: ${company}` : ""}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: GENERATE_PROMPT + "\n\n" + context },
              ],
            },
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 3000 },
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
          { error: "Failed to generate questions. Try again." },
          { status: 422 }
        );
      }

      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        questions: Array.isArray(result.questions)
          ? result.questions.map(
              (q: { question?: string; category?: string; difficulty?: string; tip?: string }) => ({
                question: String(q.question || ""),
                category: String(q.category || "behavioral"),
                difficulty: String(q.difficulty || "medium"),
                tip: String(q.tip || ""),
              })
            )
          : [],
      });
    }

    if (action === "evaluate") {
      const { question, answer } = body;
      if (!question || !answer) {
        return NextResponse.json(
          { error: "Question and answer are required." },
          { status: 400 }
        );
      }

      const context = `Interview Question: ${question}\n\nCandidate's Answer: ${answer.slice(0, 3000)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: EVALUATE_PROMPT + "\n\n" + context }],
            },
          ],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1500 },
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
          { error: "Failed to evaluate answer. Try again." },
          { status: 422 }
        );
      }

      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        rating: Math.min(5, Math.max(1, Number(result.rating) || 3)),
        feedback: String(result.feedback || ""),
        improvedAnswer: String(result.improvedAnswer || ""),
        keyPoints: Array.isArray(result.keyPoints)
          ? result.keyPoints.map(String)
          : [],
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to process request.";
    console.error("Interview prep error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
