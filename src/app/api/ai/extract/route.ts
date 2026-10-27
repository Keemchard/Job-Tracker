import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-3.8-flash";

const PROMPT = `You are a job application assistant. First determine if the provided content is a job posting or job-related content (job ad, job description, hiring post, recruitment post, etc.).

Return ONLY a valid JSON object with these exact fields:

{
  "isJobPosting": true or false,
  "notJobReason": "brief reason if not a job posting, empty string if it is",
  "company": "company/organization name",
  "position": "job title or position",
  "location": "city, state or country",
  "workMode": "remote" or "onsite" or "hybrid" or "wfh",
  "salary": "salary or compensation range if mentioned",
  "contactPerson": "recruiter or hiring manager name if mentioned",
  "contactEmail": "contact email if mentioned",
  "notes": "brief 1-2 sentence summary of key requirements or benefits"
}

Rules:
- Set "isJobPosting" to false if the content is: a news article, social media post unrelated to jobs, a meme, random text, personal photo, unrelated screenshot, etc.
- Set "isJobPosting" to true if the content is a job ad, job description, hiring announcement, or recruitment post — even informal ones (e.g. Facebook group posts looking for applicants).
- Use empty string "" for any job fields not found.
- workMode: "wfh" = work from home, "remote" = fully remote, "hybrid" = mix of office and home, "onsite" = fully in office. Default "onsite" if unclear.`;

function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim());
}

function buildGeminiBody(parts: object[]) {
  return {
    contents: [{ parts }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  };
}

function parseGeminiResponse(responseText: string): { error: string } | Record<string, string> {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { error: "Could not read AI response. Try again with clearer content." };

  try {
    const extracted = JSON.parse(jsonMatch[0]);

    if (extracted.isJobPosting === false) {
      const reason = String(extracted.notJobReason || "").trim();
      return {
        error: reason
          ? `This doesn't look like a job posting: ${reason}. Please paste or screenshot an actual job listing.`
          : "This doesn't appear to be a job posting. Please paste or screenshot an actual job listing.",
      };
    }

    const validWorkModes = ["remote", "onsite", "hybrid", "wfh"];
    if (!validWorkModes.includes(extracted.workMode)) {
      extracted.workMode = "onsite";
    }

    return {
      company: String(extracted.company || "").slice(0, 200),
      position: String(extracted.position || "").slice(0, 200),
      location: String(extracted.location || "").slice(0, 200),
      workMode: extracted.workMode,
      salary: String(extracted.salary || "").slice(0, 100),
      contactPerson: String(extracted.contactPerson || "").slice(0, 200),
      contactEmail: String(extracted.contactEmail || "").slice(0, 200),
      notes: String(extracted.notes || "").slice(0, 2000),
    };
  } catch {
    return { error: "Could not parse AI response. Try again." };
  }
}

async function callGemini(apiKey: string, parts: object[]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildGeminiBody(parts)),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    const msg = errBody?.error?.message || `HTTP ${res.status}`;
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new Error(
        `Invalid or unauthorized Gemini API key. Get a fresh key from Google AI Studio at aistudio.google.com — keys always start with "AIza".`
      );
    }
    throw new Error(`Gemini error: ${msg}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured on the server." },
      { status: 500 }
    );
  }

  let body: { text?: string; imageBase64?: string; imageMimeType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { text, imageBase64, imageMimeType } = body;

  try {
    let parts: object[];

    if (imageBase64 && imageMimeType) {
      // Image mode — screenshot analysis
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedMimeTypes.includes(imageMimeType)) {
        return NextResponse.json(
          { error: "Unsupported image type. Please use PNG, JPG, or WebP." },
          { status: 400 }
        );
      }
      parts = [
        { text: PROMPT + "\n\nExtract job details from this screenshot of a job posting:" },
        { inline_data: { mime_type: imageMimeType, data: imageBase64 } },
      ];
    } else if (text && typeof text === "string") {
      // Text mode
      if (text.trim().length < 10) {
        return NextResponse.json(
          { error: "Please paste more job description text (at least 10 characters)." },
          { status: 400 }
        );
      }
      if (isUrl(text.trim())) {
        return NextResponse.json(
          { error: "Paste the job description text — not a URL. Open the job post, select all, copy and paste the text here. Or take a screenshot and upload it instead." },
          { status: 400 }
        );
      }
      parts = [
        { text: PROMPT + "\n\nJob posting text:\n" + text.slice(0, 5000) },
      ];
    } else {
      return NextResponse.json(
        { error: "Provide either job description text or a screenshot image." },
        { status: 400 }
      );
    }

    const responseText = await callGemini(apiKey, parts);
    const result = parseGeminiResponse(responseText);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to extract job details.";
    console.error("AI extraction error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
