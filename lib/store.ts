import { promises as fs } from "fs";
import path from "path";
import {
  DATA_DIR,
  deleteUpload,
  insert,
  insertUnique,
  list,
  patch,
  remove,
  type Doc,
} from "./db";
import { EVENT, revealAt } from "./event";

/* ---------- types ---------- */

export type Attendance = "accept" | "decline";

export type Rsvp = Doc & {
  guestId: string;
  name: string;
  attendance: Attendance;
  guests: number;
  companion: string;
  meal: string;
  dietary: string;
  request: string;
};

export type MediaKind = "photo" | "video" | "voice";

export type Media = Doc & {
  guestId: string;
  kind: MediaKind;
  mime: string;
  stored: string;
  source: "capture" | "upload";
  seconds: number;
  size: number;
  context: "roll" | "guestbook" | "video" | "future";
};

export type Letter = Doc & {
  guestId: string;
  name: string;
  anonymous: boolean;
  text: string;
};

export type FutureMessage = Doc & {
  guestId: string;
  name: string;
  text: string;
  photoId: string;
  revealAt: string;
};

export type PollType = "choice" | "yesno" | "open";
export type Poll = Doc & {
  type: PollType;
  question: string;
  options: string[];
  active: boolean;
};
export type Vote = Doc & { pollId: string; guestId: string; choice: string };

export type Challenge = Doc & {
  title: string;
  description: string;
  active: boolean;
};
export type Completion = Doc & { challengeId: string; guestId: string };

export type QuestionKind = "short" | "long" | "hidden";
export type Question = Doc & {
  kind: QuestionKind;
  question: string;
  active: boolean;
};
export type Answer = Doc & { questionId: string; guestId: string; text: string };

export type Announcement = Doc & { text: string; active: boolean };

export type NoticeKind =
  | "location"
  | "host"
  | "rsvp"
  | "activity"
  | "schedule"
  | "capsule";
export type Notice = Doc & {
  kind: NoticeKind;
  title: string;
  detail: string;
  priority: boolean;
};

export type Seal = Doc & { guestId: string };

/* ---------- seed (first run only) ---------- */

let seeding: Promise<void> | null = null;

function seed(): Promise<void> {
  seeding ??= (async () => {
    const marker = path.join(DATA_DIR, "seeded");
    try {
      await fs.access(marker);
      return;
    } catch {
      /* first run */
    }
    await insert<Announcement>("announcements", {
      text: "Doors open at 22:00. Your digital pass opens the Chamber I entrance.",
      active: true,
    });
    await insert<Poll>("polls", {
      type: "choice",
      question: "Which chamber should open the night?",
      options: ["Chamber I", "Chamber East", "The roof"],
      active: true,
    });
    await insert<Poll>("polls", {
      type: "yesno",
      question: "Will you stay until dawn?",
      options: ["Yes", "No"],
      active: true,
    });
    await insert<Poll>("polls", {
      type: "open",
      question: "One word for the night?",
      options: [],
      active: true,
    });
    await insert<Challenge>("challenges", {
      title: "Hidden moment",
      description:
        "Find the lime light in Chamber East and photograph it with someone you just met.",
      active: true,
    });
    await insert<Question>("questions", {
      kind: "short",
      question: "What should be the last song of the night?",
      active: true,
    });
    await insert<Question>("questions", {
      kind: "long",
      question: "Describe a night you still think about. What made it stay?",
      active: true,
    });
    await insert<Question>("questions", {
      kind: "hidden",
      question: "What do you hope is true by next New Year's Eve?",
      active: true,
    });
    await insert<Notice>("notices", {
      kind: "host",
      title: "Host announcement",
      detail: "Doors open at 22:00. Your digital pass opens the Chamber I entrance.",
      priority: true,
    });
    await insert<Notice>("notices", {
      kind: "rsvp",
      title: "RSVP reminder",
      detail: "Respond by 24 December, 18:00.",
      priority: false,
    });
    await insert<Notice>("notices", {
      kind: "capsule",
      title: "Capsule unlock",
      detail: "The digital time capsule opens on 31 December 2027.",
      priority: false,
    });
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(marker, new Date().toISOString());
  })();
  return seeding;
}

async function seeded<T extends Doc>(name: string): Promise<T[]> {
  await seed();
  return list<T>(name);
}

/* ---------- RSVPs ---------- */

export const listRsvps = () => list<Rsvp>("rsvps");

export async function getRsvpByGuest(guestId: string) {
  return (await listRsvps()).find((r) => r.guestId === guestId) ?? null;
}

export const addRsvp = (data: Omit<Rsvp, "id" | "createdAt">) =>
  insertUnique<Rsvp>("rsvps", data, (r) => r.guestId === data.guestId);

export const updateRsvp = (
  id: string,
  data: Partial<Omit<Rsvp, "id" | "createdAt" | "guestId">>,
) => patch<Rsvp>("rsvps", id, data);

export const deleteRsvp = (id: string) =>
  remove<Rsvp>("rsvps", (r) => r.id === id);

/* ---------- media ---------- */

export const listMedia = () => list<Media>("media");
export const addMedia = (data: Omit<Media, "id" | "createdAt">) =>
  insert<Media>("media", data);
export const getMedia = async (id: string) =>
  (await listMedia()).find((m) => m.id === id) ?? null;

export async function deleteMedia(id: string) {
  const gone = await remove<Media>("media", (m) => m.id === id);
  await Promise.all(gone.map((m) => deleteUpload(m.stored)));
}

export function isRevealed(now = new Date()): boolean {
  return now >= revealAt();
}

/** Media a given viewer may see: everything once revealed, otherwise only their own. */
export function visibleMedia(
  all: Media[],
  guestId: string | null,
  admin = false,
  now = new Date(),
): Media[] {
  if (admin) return all;
  return all.filter((m) =>
    // Photos attached to a message for later stay sealed for everyone until the capsule opens.
    m.context === "future"
      ? now >= EVENT.capsuleUnlock
      : isRevealed(now) || (Boolean(guestId) && m.guestId === guestId),
  );
}

/* ---------- letters / future messages ---------- */

export const listLetters = () => list<Letter>("letters");
export const addLetter = (d: Omit<Letter, "id" | "createdAt">) =>
  insert<Letter>("letters", d);
export const deleteLetter = (id: string) =>
  remove<Letter>("letters", (l) => l.id === id);

export const listFutureMessages = () => list<FutureMessage>("futureMessages");
export const addFutureMessage = (d: Omit<FutureMessage, "id" | "createdAt">) =>
  insert<FutureMessage>("futureMessages", d);

/* ---------- polls / votes ---------- */

export const listPolls = () => seeded<Poll>("polls");
export const addPoll = (d: Omit<Poll, "id" | "createdAt">) =>
  insert<Poll>("polls", d);
export const setPollActive = (id: string, active: boolean) =>
  patch<Poll>("polls", id, { active });
export const deletePoll = async (id: string) => {
  await remove<Poll>("polls", (p) => p.id === id);
  await remove<Vote>("votes", (v) => v.pollId === id);
};

export const listVotes = () => list<Vote>("votes");
export const addVote = (d: Omit<Vote, "id" | "createdAt">) =>
  insertUnique<Vote>("votes", d, (v) => v.pollId === d.pollId && v.guestId === d.guestId);

export function tally(poll: Poll, votes: Vote[]) {
  const mine = votes.filter((v) => v.pollId === poll.id);
  const total = mine.length;
  const rows = poll.options.map((option) => {
    const count = mine.filter((v) => v.choice === option).length;
    return { option, count, percent: total ? Math.round((count / total) * 100) : 0 };
  });
  return { total, rows, answers: poll.type === "open" ? mine.map((v) => v.choice) : [] };
}

/* ---------- challenges ---------- */

export const listChallenges = () => seeded<Challenge>("challenges");
export const addChallenge = (d: Omit<Challenge, "id" | "createdAt">) =>
  insert<Challenge>("challenges", d);
export const setChallengeActive = (id: string, active: boolean) =>
  patch<Challenge>("challenges", id, { active });
export const deleteChallenge = async (id: string) => {
  await remove<Challenge>("challenges", (c) => c.id === id);
  await remove<Completion>("completions", (c) => c.challengeId === id);
};
export const listCompletions = () => list<Completion>("completions");
export const addCompletion = (d: Omit<Completion, "id" | "createdAt">) =>
  insertUnique<Completion>(
    "completions",
    d,
    (c) => c.challengeId === d.challengeId && c.guestId === d.guestId,
  );

/* ---------- host questions ---------- */

export const listQuestions = () => seeded<Question>("questions");
export const addQuestion = (d: Omit<Question, "id" | "createdAt">) =>
  insert<Question>("questions", d);
export const setQuestionActive = (id: string, active: boolean) =>
  patch<Question>("questions", id, { active });
export const deleteQuestion = async (id: string) => {
  await remove<Question>("questions", (q) => q.id === id);
  await remove<Answer>("answers", (a) => a.questionId === id);
};
export const listAnswers = () => list<Answer>("answers");
export const addAnswer = (d: Omit<Answer, "id" | "createdAt">) =>
  insertUnique<Answer>(
    "answers",
    d,
    (a) => a.questionId === d.questionId && a.guestId === d.guestId,
  );

/* ---------- announcements / notices ---------- */

export const listAnnouncements = () => seeded<Announcement>("announcements");
export const addAnnouncement = async (text: string) => {
  await seed();
  await remove<Announcement>("announcements", () => true);
  return insert<Announcement>("announcements", { text, active: true });
};
export const clearAnnouncements = () =>
  remove<Announcement>("announcements", () => true);

export const listNotices = () => seeded<Notice>("notices");
export const addNotice = (d: Omit<Notice, "id" | "createdAt">) =>
  insert<Notice>("notices", d);
export const deleteNotice = (id: string) =>
  remove<Notice>("notices", (n) => n.id === id);

/* ---------- capsule ---------- */

export const listSeals = () => list<Seal>("seals");
export const addSeal = (guestId: string) =>
  insertUnique<Seal>("seals", { guestId }, (s) => s.guestId === guestId);

export async function contributionCounts(guestId?: string | null) {
  const [media, letters, messages, answers, votes] = await Promise.all([
    listMedia(),
    listLetters(),
    listFutureMessages(),
    listAnswers(),
    listVotes(),
  ]);
  const own = <T extends { guestId: string }>(a: T[]) =>
    guestId ? a.filter((x) => x.guestId === guestId) : a;
  const m = own(media);
  return {
    photos: m.filter((x) => x.kind === "photo").length,
    videos: m.filter((x) => x.kind === "video").length,
    voices: m.filter((x) => x.kind === "voice").length,
    writing: own(letters).length + own(messages).length,
    answers: own(answers).length + own(votes).length,
  };
}
