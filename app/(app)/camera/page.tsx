import { Suspense } from "react";
import { connection } from "next/server";
import { getGuestId } from "@/lib/guest";
import { listMedia, isRevealed } from "@/lib/store";
import { DISPOSABLE_SHOTS } from "@/lib/media";
import { Content, Journey, Loading } from "../ui";
import CameraClient from "./CameraClient";

export default function CameraPage() {
  return (
    <Suspense
      fallback={
        <Content>
          <Loading />
        </Content>
      }
    >
      <CameraContent />
    </Suspense>
  );
}

async function CameraContent() {
  await connection();
  const guestId = await getGuestId();
  const media = await listMedia();
  const roll = media.filter((m) => m.context === "roll");
  const mine = guestId ? roll.filter((m) => m.guestId === guestId) : [];
  const captured = mine.filter((m) => m.source === "capture").length;

  return (
    <Content>
      <CameraClient
        totalPhotos={roll.filter((m) => m.kind === "photo").length}
        revealed={isRevealed()}
        shotsLeft={Math.max(0, DISPOSABLE_SHOTS - captured)}
        mine={mine.map((m) => ({ id: m.id, kind: m.kind }))}
      />
      <Journey action="OPEN CAMERA" here="PARTICIPATE" />
    </Content>
  );
}
