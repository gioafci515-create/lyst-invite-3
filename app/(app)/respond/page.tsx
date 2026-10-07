import { Suspense } from "react";
import { connection } from "next/server";
import { getGuestId } from "@/lib/guest";
import { getRsvpByGuest } from "@/lib/store";
import { EVENT } from "@/lib/event";
import { Content, Journey, Loading } from "../ui";
import RsvpFlow from "./RsvpFlow";

export default function RespondPage() {
  return (
    <Suspense
      fallback={
        <Content>
          <Loading />
        </Content>
      }
    >
      <RespondContent />
    </Suspense>
  );
}

async function RespondContent() {
  await connection();
  const guestId = await getGuestId();
  const rsvp = guestId ? await getRsvpByGuest(guestId) : null;
  const closed = new Date() > EVENT.rsvpDeadline;

  return (
    <Content>
      <RsvpFlow
        closed={closed}
        existing={
          rsvp && {
            name: rsvp.name,
            attendance: rsvp.attendance,
            guests: rsvp.guests,
            companion: rsvp.companion,
            meal: rsvp.meal,
            dietary: rsvp.dietary,
            request: rsvp.request,
          }
        }
      />
      <Journey action="CONFIRM RESPONSE" here="RESPOND" />
    </Content>
  );
}
