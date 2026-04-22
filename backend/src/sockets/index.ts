import { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../utils/auth.js";

const ensureRoomAccess = async (roomId: string, userId: string) => {
  const meeting = await prisma.meeting.findFirst({
    where: {
      roomId,
      OR: [{ organizerId: userId }, { inviteeId: userId }],
    },
  });

  return Boolean(meeting);
};

export const registerSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      return next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-room", async ({ roomId }: { roomId: string }) => {
      const allowed = await ensureRoomAccess(roomId, socket.data.userId as string);

      if (!allowed) {
        socket.emit("room-error", {
          message: "You are not allowed to join this room.",
        });
        return;
      }

      socket.join(roomId);
      socket.to(roomId).emit("peer-joined", {
        userId: socket.data.userId,
      });
    });

    socket.on("leave-room", ({ roomId }: { roomId: string }) => {
      socket.leave(roomId);
      socket.to(roomId).emit("peer-left", {
        userId: socket.data.userId,
      });
    });

    socket.on("webrtc-offer", ({ roomId, offer }) => {
      socket.to(roomId).emit("webrtc-offer", {
        offer,
        fromUserId: socket.data.userId,
      });
    });

    socket.on("webrtc-answer", ({ roomId, answer }) => {
      socket.to(roomId).emit("webrtc-answer", {
        answer,
        fromUserId: socket.data.userId,
      });
    });

    socket.on("webrtc-ice-candidate", ({ roomId, candidate }) => {
      socket.to(roomId).emit("webrtc-ice-candidate", {
        candidate,
        fromUserId: socket.data.userId,
      });
    });

    socket.on("call-ended", ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit("call-ended", {
        fromUserId: socket.data.userId,
      });
    });
  });

  return io;
};
