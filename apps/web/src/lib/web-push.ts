import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  process.env.VAPID_CONTACT ?? "mailto:admin@sarkaritrack.in",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function broadcastPushNotification(payload: {
  title: string; body: string; url: string; icon?: string;
}): Promise<{ sent: number; failed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany({ take: 5000 });
  const notification = JSON.stringify({
    title: payload.title, body: payload.body,
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    data: { url: payload.url },
  });
  let sent = 0, failed = 0;
  const expired: string[] = [];
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dhKey, auth: sub.authKey } },
          notification, { TTL: 86400 }
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err?.statusCode === 410 || err?.statusCode === 404) expired.push(sub.endpoint);
      }
    })
  );
  if (expired.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expired } } });
  }
  return { sent, failed };
}
