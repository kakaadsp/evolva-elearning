import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gradeWithAI } from "@/lib/groq/client";
import type { GradeRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const body: GradeRequest = await request.json();
    const { submission_id, lkpd_title, questions, answers, student_name } = body;

    if (!submission_id || !questions || !answers) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const supabase = await createClient();

    // Mark as grading
    await supabase
      .from("lkpd_submissions")
      .update({ status: "ai_grading" })
      .eq("id", submission_id);

    // Call Groq AI
    const feedback = await gradeWithAI(lkpd_title, questions, answers, student_name);

    // Update submission with AI results
    const { error } = await supabase
      .from("lkpd_submissions")
      .update({
        status: "ai_graded",
        ai_score: feedback.total_score,
        ai_feedback: feedback,
        answers: answers.map((a, i) => ({
          ...a,
          ai_score: feedback.question_feedbacks[i]?.score,
          ai_feedback: feedback.question_feedbacks[i]?.feedback,
        })),
      })
      .eq("id", submission_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("AI Grading error:", error);
    return NextResponse.json(
      { error: "Gagal menghubungi Groq AI. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
