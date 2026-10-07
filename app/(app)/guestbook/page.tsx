import { Suspense } from "react";
import { connection } from "next/server";
import { getGuestId } from "@/lib/guest";
import { listMedia } from "@/lib/store";
import { Content, Journey, Loading } from "../ui";
import VoiceRecorder from "./VoiceRecorder";

export default function GuestbookPage() {
  return (
    <Suspense
      fallback={
        <Content>
          <Loading />
        </Content>
      }
    >
      <GuestbookContent />
    </Suspense>
  );
}

async function GuestbookContent() {
  await connection();
  const guestId = await getGuestId();
  const memories = (await listMedia()).filter((m) => m.context === "guestbook");
  const mine = guestId ? memories.filter((m) => m.guestId === guestId) : [];

  return (
    <Content>
      <VoiceRecorder total={memories.length} mine={mine.map((m) => m.id)} />
      <Journey action="SUBMIT MEMORY" here="PARTICIPATE" />
    </Content>
  );
}
