import { Suspense } from "react";

import { VideoRoom } from "@/components/features/video/video-room";

export default function VideoPage() {
  return (
    <Suspense fallback={null}>
      <VideoRoom />
    </Suspense>
  );
}
