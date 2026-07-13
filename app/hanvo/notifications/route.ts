import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const searchParams = request.nextUrl.searchParams;
  const clerkId = searchParams.get("clerkId");

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Helper to fetch notifications by Clerk ID
      const fetchNotifications = async () => {
        if (!clerkId) return null;
        const user = await prisma.user.findUnique({
          where: { clerkUserId: clerkId },
          select: { id: true }
        });
        if (!user) return null;

        return prisma.notification.findMany({
          where: {
            userId: user.id,
            status: "SENT",
            channel: "IN_APP"
          },
          orderBy: { createdAt: "desc" }
        });
      };

      // Initial feed
      try {
        const unread = await fetchNotifications();
        if (unread) {
          sendEvent({ count: unread.length, notifications: unread });
        }
      } catch (err) {
        // ignore
      }

      // Check database every 8 seconds
      const interval = setInterval(async () => {
        try {
          const unread = await fetchNotifications();
          if (unread) {
            sendEvent({ count: unread.length, notifications: unread });
          }
        } catch (err) {
          // ignore
        }
      }, 8000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    }
  });
}
