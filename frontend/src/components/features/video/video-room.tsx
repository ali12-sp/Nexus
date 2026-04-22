"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, Mic, PhoneOff, RefreshCcw, Video } from "lucide-react";
import { io, type Socket } from "socket.io-client";

import { useAuth } from "@/components/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch, ApiError, SOCKET_URL } from "@/lib/api";
import type { Meeting } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const VideoRoom = () => {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [roomId, setRoomId] = useState(searchParams.get("roomId") ?? "");
  const [meetingId, setMeetingId] = useState(searchParams.get("meetingId") ?? "");
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef(roomId);

  const loadMeetings = async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFetch<Meeting[]>("/meetings?status=ACCEPTED", {
        token,
      });

      const sorted = result.sort(
        (left, right) =>
          new Date(left.startTime).getTime() - new Date(right.startTime).getTime(),
      );

      setMeetings(sorted);

      if (!roomIdRef.current && sorted[0]) {
        setMeetingId(sorted[0].id);
        setRoomId(sorted[0].roomId);
        roomIdRef.current = sorted[0].roomId;
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to load accepted meetings.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMeetings();
  }, [token]);

  useEffect(() => {
    const requestedMeetingId = searchParams.get("meetingId");
    const requestedRoomId = searchParams.get("roomId");

    if (requestedMeetingId) {
      setMeetingId(requestedMeetingId);
    }

    if (requestedRoomId) {
      setRoomId(requestedRoomId);
      roomIdRef.current = requestedRoomId;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!meetingId) {
      return;
    }

    const match = meetings.find((meeting) => meeting.id === meetingId);

    if (match) {
      setRoomId(match.roomId);
      roomIdRef.current = match.roomId;
    }
  }, [meetingId, meetings]);

  const attachRemoteStream = () => {
    if (!remoteStreamRef.current) {
      remoteStreamRef.current = new MediaStream();
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  };

  const ensureLocalMedia = async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    attachRemoteStream();
    return stream;
  };

  const createPeerConnection = (activeRoomId: string, socket: Socket) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = peerConnection;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      socket.emit("webrtc-ice-candidate", {
        roomId: activeRoomId,
        candidate: event.candidate,
      });
    };

    peerConnection.ontrack = (event) => {
      attachRemoteStream();

      event.streams[0].getTracks().forEach((track) => {
        if (!remoteStreamRef.current?.getTracks().some((existingTrack) => existingTrack.id === track.id)) {
          remoteStreamRef.current?.addTrack(track);
        }
      });
    };

    return peerConnection;
  };

  const resetMedia = () => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setAudioEnabled(true);
    setVideoEnabled(true);
  };

  const leaveCall = async (notifyPeer = true) => {
    const activeRoomId = roomIdRef.current;

    if (notifyPeer && socketRef.current && activeRoomId) {
      socketRef.current.emit("call-ended", { roomId: activeRoomId });
      socketRef.current.emit("leave-room", { roomId: activeRoomId });
    }

    socketRef.current?.disconnect();
    socketRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    resetMedia();
    setStatus("Disconnected");
  };

  useEffect(() => {
    return () => {
      void leaveCall(false);
    };
  }, []);

  const joinRoom = async () => {
    if (!token || !roomId) {
      setError("Select an accepted meeting first.");
      return;
    }

    setIsJoining(true);
    setError(null);
    setStatus("Preparing local media...");

    try {
      await leaveCall(false);
      const localStream = await ensureLocalMedia();
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = audioEnabled;
      });
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = videoEnabled;
      });

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      socketRef.current = socket;
      roomIdRef.current = roomId;
      const peerConnection = createPeerConnection(roomId, socket);

      socket.on("connect", () => {
        setStatus("Connected to signaling server");
        socket.emit("join-room", { roomId });
      });

      socket.on("room-error", ({ message }: { message: string }) => {
        setError(message);
        setStatus("Room access denied");
      });

      socket.on("peer-joined", async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("webrtc-offer", {
          roomId,
          offer,
        });
        setStatus("Offer sent");
      });

      socket.on("webrtc-offer", async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("webrtc-answer", {
          roomId,
          answer,
        });
        setStatus("Answer sent");
      });

      socket.on("webrtc-answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        setStatus("Peer connected");
      });

      socket.on(
        "webrtc-ice-candidate",
        async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            setStatus("Waiting for more network candidates");
          }
        },
      );

      socket.on("peer-left", () => {
        attachRemoteStream();
        remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current = new MediaStream();
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
        setStatus("Peer left room");
      });

      socket.on("call-ended", () => {
        void leaveCall(false);
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to join the video room.",
      );
      setStatus("Failed to connect");
    } finally {
      setIsJoining(false);
    }
  };

  const toggleAudio = () => {
    const nextState = !audioEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextState;
    });
    setAudioEnabled(nextState);
  };

  const toggleVideo = () => {
    const nextState = !videoEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextState;
    });
    setVideoEnabled(nextState);
  };

  return (
    <AppShell
      description="Join accepted meeting rooms through authenticated Socket.IO signaling and peer-to-peer WebRTC media exchange."
      title="Video room"
    >
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card
          action={
            <Button onClick={() => void loadMeetings()} variant="outline">
              <RefreshCcw className="mr-2" size={16} />
              Refresh rooms
            </Button>
          }
          description="Choose an accepted meeting to derive the room id and access control."
          title="Meeting room selector"
        >
          <div className="space-y-4">
            <Select
              label="Accepted meeting"
              onChange={(event) => setMeetingId(event.target.value)}
              value={meetingId}
            >
              <option value="">Select a meeting</option>
              {meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.title} | {formatDateTime(meeting.startTime)}
                </option>
              ))}
            </Select>

            <div className="rounded-[24px] bg-sand/70 p-5">
              <p className="text-sm text-slate">Room id</p>
              <p className="mt-2 break-all font-mono text-sm text-ink">{roomId || "Not selected yet"}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button disabled={isJoining || !roomId} onClick={() => void joinRoom()}>
                <Video className="mr-2" size={16} />
                {isJoining ? "Joining..." : "Join room"}
              </Button>
              <Button onClick={() => void leaveCall()} variant="danger">
                <PhoneOff className="mr-2" size={16} />
                Leave room
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={toggleAudio} variant="outline">
                <Mic className="mr-2" size={16} />
                {audioEnabled ? "Mute audio" : "Unmute audio"}
              </Button>
              <Button onClick={toggleVideo} variant="outline">
                <Camera className="mr-2" size={16} />
                {videoEnabled ? "Hide video" : "Show video"}
              </Button>
            </div>

            <Badge tone={status === "Peer connected" ? "success" : "neutral"}>{status}</Badge>
            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">{error}</p> : null}
            {isLoading ? <p className="text-sm text-slate">Loading accepted meetings...</p> : null}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card description="Your local device feed" title="Local stream">
            <video
              autoPlay
              className="aspect-video w-full rounded-[28px] bg-ink object-cover"
              muted
              playsInline
              ref={localVideoRef}
            />
          </Card>
          <Card description="Remote peer media appears after signaling completes" title="Remote stream">
            <video
              autoPlay
              className="aspect-video w-full rounded-[28px] bg-ink object-cover"
              playsInline
              ref={remoteVideoRef}
            />
          </Card>
        </div>
      </div>
    </AppShell>
  );
};
