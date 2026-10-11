import { db } from "../db";
import { sendEmail } from "../email";
import { env } from "../env";
import { BRAND } from "../brand";

export interface NotificationInput {
  type: string;
  title: string;
  body?: string;
  link?: string;
}

type EmailPref = "requests" | "messages" | "updates";

function prefFor(type: string): EmailPref {
  if (type.startsWith("message") || type.startsWith("offer")) return "messages";
  if (type.startsWith("access")) return "requests";
  return "updates";
}

/**
 * In-app notification plus an optional email, according to the user's preferences.
 * Emails never contain confidential listing data — only a title and a link back to the app.
 */
export async function notify(userId: string, n: NotificationInput) {
  await db.notification.create({ data: { userId, ...n } });
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, status: true, notifyEmailRequests: true, notifyEmailMessages: true, notifyEmailUpdates: true },
  });
  if (!user || user.status !== "ACTIVE") return;
  const pref = prefFor(n.type);
  const wants =
    (pref === "requests" && user.notifyEmailRequests) ||
    (pref === "messages" && user.notifyEmailMessages) ||
    (pref === "updates" && user.notifyEmailUpdates);
  if (wants) {
    await sendEmail({
      to: user.email,
      subject: `${BRAND.name}: ${n.title}`,
      text: `${n.title}\n\nOpen ${BRAND.name} to see the details:\n${env.appUrl}${n.link ?? "/notifications"}\n\nManage email notifications in Settings → Notifications.`,
    });
  }
}

export async function notifyMany(userIds: string[], n: NotificationInput) {
  for (const id of userIds) await notify(id, n);
}

export async function markAllRead(userId: string) {
  await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

export async function unreadCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
