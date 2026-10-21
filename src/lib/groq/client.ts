import Groq from "groq-sdk";
import type { LKPDQuestion, LKPDAnswer, AIFeedback } from "@/types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function gradeWithAI(
  lkpdTitle: string,
  questions: LKPDQuestion[],
  answers: LKPDAnswer[],
  studentName: string
): Promise<AIFeedback> {
  const systemPrompt = `Kamu adalah asisten akademis AI bernama Evolva AI, ditenagai oleh Groq. 
Tugasmu adalah mengoreksi dan memberikan umpan balik konstruktif untuk jawaban mahasiswa FMIPA pada LKPD (Lembar Kerja Peserta Didik).

ATURAN PENILAIAN:
1. Berikan skor objektif berdasarkan rubrik yang diberikan
2. Umpan balik harus spesifik, membangun, dan dalam Bahasa Indonesia
3. Identifikasi kekuatan dan area perbaikan
4. Gunakan pendekatan konstruktivis: dorong mahasiswa membangun pemahaman
5. Untuk rumus matematika/sains, periksa kebenaran konsep dan langkah penyelesaian
6. Kembalikan HANYA JSON valid sesuai format yang diminta`;

  const questionsText = questions
    .map(
      (q, i) =>
        `Soal ${i + 1} (Maks: ${q.max_points} poin):\n${q.question_text}${
          q.rubric_hint ? `\nRubrik: ${q.rubric_hint}` : ""
        }`
    )
    .join("\n\n");

  const answersText = answers
    .map(
      (a, i) =>
        `Soal ${i + 1} - Jawaban:\n${a.answer_text || "(Tidak dijawab)"}`
    )
    .join("\n\n");

  const userPrompt = `LKPD: "${lkpdTitle}"
Mahasiswa: ${studentName}

=== SOAL ===
${questionsText}

=== JAWABAN MAHASISWA ===
${answersText}

=== FORMAT RESPONS JSON ===
{
  "total_score": <total skor>,
  "max_score": <total maks>,
  "percentage": <0-100>,
  "overall_feedback": "<umpan balik umum dalam Bahasa Indonesia>",
  "question_feedbacks": [
    { "question_id": "<id>", "score": <skor>, "max_points": <maks>, "feedback": "<umpan balik>" }
  ],
  "strengths": ["<kelebihan 1>", "<kelebihan 2>"],
  "improvements": ["<area perbaikan 1>", "<area perbaikan 2>"],
  "model_used": "llama-3.3-70b-versatile",
  "graded_at": "${new Date().toISOString()}"
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty response");

  const feedback = JSON.parse(content) as AIFeedback;
  feedback.graded_at = new Date().toISOString();
  feedback.model_used = "llama-3.3-70b-versatile (Groq Cloud)";

  return feedback;
}

export { groq };
