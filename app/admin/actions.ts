"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkPassword,
  createSession,
  destroySession,
  isAdmin,
} from "@/lib/auth";
import {
  addAnnouncement,
  addChallenge,
  addNotice,
  addPoll,
  addQuestion,
  clearAnnouncements,
  deleteChallenge,
  deleteLetter,
  deleteMedia,
  deleteNotice,
  deletePoll,
  deleteQuestion,
  deleteRsvp,
  setChallengeActive,
  setPollActive,
  setQuestionActive,
  type NoticeKind,
  type PollType,
  type QuestionKind,
} from "@/lib/store";

export type LoginState = { error?: string };

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}

const text = (f: FormData, k: string, max: number) =>
  String(f.get(k) ?? "").trim().slice(0, max);

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) return { error: "Wrong password." };
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ---------- responses ---------- */

export async function removeRsvp(formData: FormData) {
  await guard();
  await deleteRsvp(text(formData, "id", 64));
  revalidatePath("/admin");
}

/* ---------- content ---------- */

export async function setAnnouncement(formData: FormData) {
  await guard();
  const t = text(formData, "text", 300);
  if (t) await addAnnouncement(t);
  revalidatePath("/admin/content");
}

export async function removeAnnouncement() {
  await guard();
  await clearAnnouncements();
  revalidatePath("/admin/content");
}

const NOTICE_KINDS: NoticeKind[] = ["location", "host", "rsvp", "activity", "schedule", "capsule"];

export async function createNotice(formData: FormData) {
  await guard();
  const kind = NOTICE_KINDS.find((k) => k === formData.get("kind"));
  const title = text(formData, "title", 120);
  const detail = text(formData, "detail", 600);
  if (!kind || !title) return;
  await addNotice({ kind, title, detail, priority: formData.get("priority") === "on" });
  revalidatePath("/admin/content");
}

export async function removeNotice(formData: FormData) {
  await guard();
  await deleteNotice(text(formData, "id", 64));
  revalidatePath("/admin/content");
}

export async function createPoll(formData: FormData) {
  await guard();
  const type = (["choice", "yesno", "open"] as PollType[]).find((t) => t === formData.get("type"));
  const question = text(formData, "question", 200);
  if (!type || !question) return;
  const options =
    type === "yesno"
      ? ["Yes", "No"]
      : type === "open"
        ? []
        : text(formData, "options", 800)
            .split("\n")
            .map((o) => o.trim().slice(0, 100))
            .filter(Boolean)
            .slice(0, 8);
  if (type === "choice" && options.length < 2) return;
  await addPoll({ type, question, options, active: true });
  revalidatePath("/admin/content");
}

export async function togglePoll(formData: FormData) {
  await guard();
  await setPollActive(text(formData, "id", 64), formData.get("active") === "true");
  revalidatePath("/admin/content");
}

export async function removePoll(formData: FormData) {
  await guard();
  await deletePoll(text(formData, "id", 64));
  revalidatePath("/admin/content");
}

export async function createChallenge(formData: FormData) {
  await guard();
  const title = text(formData, "title", 120);
  const description = text(formData, "description", 400);
  if (!title) return;
  await addChallenge({ title, description, active: true });
  revalidatePath("/admin/content");
}

export async function toggleChallenge(formData: FormData) {
  await guard();
  await setChallengeActive(text(formData, "id", 64), formData.get("active") === "true");
  revalidatePath("/admin/content");
}

export async function removeChallenge(formData: FormData) {
  await guard();
  await deleteChallenge(text(formData, "id", 64));
  revalidatePath("/admin/content");
}

export async function createQuestion(formData: FormData) {
  await guard();
  const kind = (["short", "long", "hidden"] as QuestionKind[]).find((k) => k === formData.get("kind"));
  const question = text(formData, "question", 300);
  if (!kind || !question) return;
  await addQuestion({ kind, question, active: true });
  revalidatePath("/admin/content");
}

export async function toggleQuestion(formData: FormData) {
  await guard();
  await setQuestionActive(text(formData, "id", 64), formData.get("active") === "true");
  revalidatePath("/admin/content");
}

export async function removeQuestion(formData: FormData) {
  await guard();
  await deleteQuestion(text(formData, "id", 64));
  revalidatePath("/admin/content");
}

/* ---------- submissions ---------- */

export async function removeMedia(formData: FormData) {
  await guard();
  await deleteMedia(text(formData, "id", 64));
  revalidatePath("/admin/submissions");
}

export async function removeLetter(formData: FormData) {
  await guard();
  await deleteLetter(text(formData, "id", 64));
  revalidatePath("/admin/submissions");
}
