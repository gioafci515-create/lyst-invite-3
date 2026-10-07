import { Suspense } from "react";
import { connection } from "next/server";
import { listNotices } from "@/lib/store";
import { Content, Journey, Loading } from "../ui";
import NotificationList from "./NotificationList";

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <Content>
          <Loading />
        </Content>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}

async function NotificationsContent() {
  await connection();
  const notices = await listNotices();
  return (
    <Content>
      <NotificationList
        notices={notices.map((n) => ({
          id: n.id,
          kind: n.kind,
          title: n.title,
          detail: n.detail,
          priority: n.priority,
          createdAt: n.createdAt,
        }))}
      />
      <Journey action="MARK ALL READ" here="PARTICIPATE" />
    </Content>
  );
}
