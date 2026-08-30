import { NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const jobDescription = body.jobDescription?.trim();
    const resumeText = body.resumeText?.trim();

    if (!jobDescription || !resumeText) {
      return NextResponse.json(
        {
          error: "Job description and resume text are required.",
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENROUTER_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const prompt = `
You are an expert technical recruiter and professional job application writer.

Create a concise, natural and highly personalized job application email using the
job description and candidate resume provided below.

IMPORTANT RULES:

1. Do not invent experience, employers, technologies, achievements, certifications,
   education or numbers that are not supported by the resume.
2. Prioritize experience that directly matches the job description.
3. Keep the email professional and human.
4. Avoid generic AI-style phrases such as "I am thrilled to apply".
5. Do not make the email excessively long.
6. Mention the strongest 3 to 5 relevant qualifications.
7. The candidate is applying for the job directly, so make the email sound confident,
   not desperate.
8. Include a subject line.
9. Do not use markdown.
10. Return ONLY valid JSON in this format:

{
  "subject": "email subject",
  "body": "email body"
}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
${resumeText}
`;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Job Mailer AI",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content:
              "You are a professional technical recruiter and job application writer. Follow the user's formatting requirements exactly.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("OpenRouter error:", errorText);

      return NextResponse.json(
        {
          error: "AI generation failed.",
          details: errorText,
        },
        { status: 500 }
      );
    }

    const result = await response.json();

    const content = result?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error: "The AI returned an empty response.",
        },
        { status: 500 }
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      const cleaned = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return NextResponse.json(
          {
            error: "The AI returned an invalid response.",
            raw: content,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      subject: parsed.subject || "",
      body: parsed.body || "",
    });
  } catch (error) {
    console.error("Generate error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while generating the email.",
      },
      { status: 500 }
    );
  }
}