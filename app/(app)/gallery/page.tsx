import { Suspense } from "react";
import { connection } from "next/server";
import { getGuestId } from "@/lib/guest";
import { isRevealed, listMedia, visibleMedia } from "@/lib/store";
import { Content, Journey, Loading } from "../ui";
import GalleryClient from "./GalleryClient";

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <Content>
          <Loading />
        </Content>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}

async function GalleryContent() {
  await connection();
  const guestId = await getGuestId();
  const roll = (await listMedia()).filter((m) => m.context === "roll");
  const seen = visibleMedia(roll, guestId);

  return (
    <Content>
      <GalleryClient
        total={roll.length}
        revealed={isRevealed()}
        items={seen.map((m) => ({
          id: m.id,
          kind: m.kind === "video" ? "video" : "photo",
          mine: Boolean(guestId) && m.guestId === guestId,
        }))}
      />
      <Journey action="UPLOAD MOMENT" here="REMEMBER" />
    </Content>
  );
}
