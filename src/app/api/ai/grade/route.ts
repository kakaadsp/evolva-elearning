import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { gradeWithAI } from "@/lib/groq/client";
import type { GradeRequest } from "@/types";

export async function POST(request: Request) {
  let subId = "";
  try {
    const body: GradeRequest = await request.json();
    const { submission_id, lkpd_title, questions, answers, student_name } = body;
    subId = submission_id;

    const adminSupabase = await createAdminClient();

    let title = lkpd_title;
    let qs = questions;
    let ans = answers;
    let sName = student_name;

    // Fallback: If questions, answers, title, or student_name are missing from request, fetch directly from DB
    if (!qs || !ans || !title || !sName) {
      const { data: subData } = await adminSupabase
        .from("lkpd_submissions")
        .select(`
          id, answers,
          student:profiles!lkpd_submissions_student_id_fkey(full_name),
          lkpd:lkpd!lkpd_submissions_lkpd_id_fkey(title, questions)
        `)
        .eq("id", submission_id)
        .single();

      if (subData) {
        ans = ans || (subData.answers as typeof answers);
        // @ts-expect-error joined relation
        qs = qs || subData.lkpd?.questions;
        // @ts-expect-error joined relation
        title = title || subData.lkpd?.title;
        // @ts-expect-error joined relation
        sName = sName || subData.student?.full_name || "Mahasiswa";
      }
    }

    if (!submission_id || !qs || !ans) {
      return NextResponse.json({ error: "Data tugas tidak lengkap untuk dikoreksi." }, { status: 400 });
    }

    // Mark as grading
    await adminSupabase
      .from("lkpd_submissions")
      .update({ status: "ai_grading" })
      .eq("id", submission_id);

    // Call Groq AI
    const feedback = await gradeWithAI(title || "LKPD", qs, ans, sName || "Mahasiswa");

    // Map each answer to its corresponding feedback by question_id or index
    const enrichedAnswers = ans.map((a, i) => {
      const qf =
        feedback.question_feedbacks?.find((item) => item.question_id === a.question_id) ||
        feedback.question_feedbacks?.[i];
      return {
        ...a,
        ai_score: qf?.score ?? 0,
        ai_feedback: qf?.feedback ?? "",
      };
    });

    // Update submission with AI results
    const { error } = await adminSupabase
      .from("lkpd_submissions")
      .update({
        status: "ai_graded",
        ai_score: feedback.total_score,
        ai_feedback: feedback,
        answers: enrichedAnswers,
      })
      .eq("id", submission_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, feedback, answers: enrichedAnswers });
  } catch (error) {
    console.error("AI Grading error:", error);
    if (subId) {
      try {
        const adminSupabase = await createAdminClient();
        await adminSupabase
          .from("lkpd_submissions")
          .update({ status: "submitted" })
          .eq("id", subId);
      } catch (revertErr) {
        console.error("Failed to revert submission status:", revertErr);
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menghubungi Groq AI. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
