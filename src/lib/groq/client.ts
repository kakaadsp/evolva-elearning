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
        `Soal ${i + 1} [ID: "${q.id}"] (Maks: ${q.max_points} poin):\n${q.question_text}${
          q.rubric_hint ? `\nRubrik Penilaian: ${q.rubric_hint}` : ""
        }`
    )
    .join("\n\n");

  const answersText = answers
    .map((a, i) => {
      const q = questions.find((item) => item.id === a.question_id) || questions[i];
      return `Soal ${i + 1} [ID: "${a.question_id || q?.id}"] - Jawaban Mahasiswa:\n${
        a.answer_text?.trim() ? a.answer_text : "(Tidak dijawab)"
      }`;
    })
    .join("\n\n");

  const userPrompt = `LKPD: "${lkpdTitle}"
Mahasiswa: ${studentName || "Mahasiswa"}

=== SOAL & RUBRIK ===
${questionsText}

=== JAWABAN MAHASISWA ===
${answersText}

=== FORMAT RESPONS JSON (KEMBALIKAN HANYA JSON OBJECT) ===
{
  "total_score": <total skor numerik>,
  "max_score": <total maksimum poin>,
  "percentage": <persentase 0-100>,
  "overall_feedback": "<umpan balik umum konstruktif dalam Bahasa Indonesia>",
  "question_feedbacks": [
    { "question_id": "<id soal>", "score": <skor numerik>, "max_points": <maks poin>, "feedback": "<umpan balik terperinci>" }
  ],
  "strengths": ["<kelebihan 1>", "<kelebihan 2>"],
  "improvements": ["<area perbaikan 1>", "<area perbaikan 2>"]
}`;

  const candidateModels = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
  ];

  let lastError: Error | null = null;
  for (const model of candidateModels) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Groq returned empty response");

      let clean = content.trim();
      if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
      } else if (clean.startsWith("```")) {
        clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const feedback = JSON.parse(clean) as AIFeedback;
      
      // Ensure numeric values and structure safety
      const calculatedMax = questions.reduce((acc, q) => acc + (Number(q.max_points) || 0), 0);
      feedback.total_score = Math.round(Number(feedback.total_score) || 0);
      feedback.max_score = Math.round(Number(feedback.max_score) || calculatedMax || 100);
      feedback.percentage = Math.round(
        Number(feedback.percentage) ||
          (feedback.max_score > 0 ? (feedback.total_score / feedback.max_score) * 100 : 0)
      );

      if (!Array.isArray(feedback.strengths)) feedback.strengths = [];
      if (!Array.isArray(feedback.improvements)) feedback.improvements = [];
      if (!Array.isArray(feedback.question_feedbacks)) feedback.question_feedbacks = [];

      // Ensure question feedbacks correspond to questions
      feedback.question_feedbacks = feedback.question_feedbacks.map((qf, i) => ({
        question_id: qf.question_id || questions[i]?.id || `q-${i + 1}`,
        score: Math.round(Number(qf.score) || 0),
        max_points: Math.round(Number(qf.max_points) || questions[i]?.max_points || 0),
        feedback: qf.feedback || "Tidak ada catatan.",
      }));

      feedback.graded_at = new Date().toISOString();
      feedback.model_used = `${model} (Groq AI)`;

      return feedback;
    } catch (err: unknown) {
      console.warn(`Groq model ${model} failed, trying next candidate:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("Semua model Groq AI gagal merespons.");
}

export { groq };
