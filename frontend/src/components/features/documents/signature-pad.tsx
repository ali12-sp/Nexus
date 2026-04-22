"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

type SignaturePadProps = {
  onSave: (dataUrl: string) => void;
};

export const SignaturePad = ({ onSave }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const paintBackground = (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";
    context.lineWidth = 2.5;
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = 220 * ratio;
    const context = canvas.getContext("2d");

    if (context) {
      context.scale(ratio, ratio);
    }

    paintBackground(canvas);
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const point = getPoint(event);
    const context = canvas?.getContext("2d");

    if (!point || !context) {
      return;
    }

    isDrawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const point = getPoint(event);
    const context = canvas?.getContext("2d");

    if (!point || !context) {
      return;
    }

    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    paintBackground(canvas);
  };

  return (
    <div className="space-y-4">
      <canvas
        className="h-[220px] w-full rounded-[24px] border border-dashed border-slate-200 bg-white"
        onPointerDown={handlePointerDown}
        onPointerLeave={stopDrawing}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrawing}
        ref={canvasRef}
      />
      <div className="flex flex-wrap gap-3">
        <Button onClick={clearCanvas} type="button" variant="outline">
          Clear signature
        </Button>
        <Button
          onClick={() => {
            const canvas = canvasRef.current;

            if (!canvas) {
              return;
            }

            onSave(canvas.toDataURL("image/png"));
          }}
          type="button"
        >
          Save signature
        </Button>
      </div>
    </div>
  );
};
