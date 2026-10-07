import { Suspense } from "react";
import { connection } from "next/server";
import { getGuestId } from "@/lib/guest";
import { listMedia } from "@/lib/store";
import { Content, Journey, Loading } from "../ui";
import VideoRecorder from "./VideoRecorder";

export default function VideosPage() {
  return (
    <Suspense
      fallback={
        <Content>
          <Loading />
        </Content>
      }
    >
      <VideosContent />
    </Suspense>
  );
}

async function VideosContent() {
  await connection();
  const guestId = await getGuestId();
  const clips = (await listMedia()).filter((m) => m.context === "video");
  const mine = guestId ? clips.filter((m) => m.guestId === guestId).length : 0;

  return (
    <Content>
      <VideoRecorder total={clips.length} mine={mine} />
      <Journey action="ADD TO MONTAGE" here="PARTICIPATE" />
    </Content>
  );
}
