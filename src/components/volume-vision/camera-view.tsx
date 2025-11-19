"use client";

import React, { useEffect, useRef, useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrientation } from "@/hooks/use-orientation";

export type FacingMode = "user" | "environment";
export type DetectedObject = {
  label: string;
  box: number[]; // [x_min, y_min, x_max, y_max] normalized
};

type CameraViewProps = {
  liquidLevel: number; // 0-100
  volume: number;
  unit: "ml" | "oz";
  confidenceScore: number | null;
  isDetecting: boolean;
  facingMode: FacingMode;
  detectedObjects: DetectedObject[];
  onCameraPermissionChange: (hasPermission: boolean) => void;
};

export const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(({
  liquidLevel,
  volume,
  unit,
  confidenceScore,
  isDetecting,
  facingMode,
  detectedObjects,
  onCameraPermissionChange,
}, ref) => {
  const { toast } = useToast();
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = (ref as React.RefObject<HTMLVideoElement>) || internalVideoRef;

  const streamRef = useRef<MediaStream | null>(null);
  useOrientation(); // Re-evaluate on orientation change

  useEffect(() => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode }
        });
        streamRef.current = stream;
        onCameraPermissionChange(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        onCameraPermissionChange(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description:
            "Please enable camera permissions in your browser settings to use this app.",
        });
      }
    };

    getCameraPermission();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, [toast, facingMode, videoRef, onCameraPermissionChange]);

  const ozVolume = volume * 0.033814;
  const displayVolume = unit === 'oz' ? ozVolume : volume;

  const waterHeight = `${liquidLevel}%`;

  const confidenceColor = confidenceScore === null ? "text-muted-foreground" : confidenceScore > 0.7 ? "text-success" : confidenceScore > 0.4 ? "text-warning" : "text-danger";
  const ConfidenceIcon = confidenceScore === null ? AlertTriangle : confidenceScore > 0.7 ? CheckCircle2 : AlertTriangle;

  return (
    <div className={cn(
      "relative w-full h-full mx-auto overflow-hidden rounded-2xl shadow-2xl bg-neutral-800 border-4 border-neutral-700"
    )}>
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
      
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isDetecting ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Bounding Boxes for detected objects */}
        {detectedObjects.map((obj, index) => {
          const [xMin, yMin, xMax, yMax] = obj.box;
          const boxWidth = (xMax - xMin) * 100;
          const boxHeight = (yMax - yMin) * 100;

          if (boxWidth <= 0 || boxHeight <= 0) return null;

          return (
            <div key={index}>
              <div
                className="absolute border-2 border-accent rounded-lg shadow-lg"
                style={{
                  left: `${xMin * 100}%`,
                  top: `${yMin * 100}%`,
                  width: `${boxWidth}%`,
                  height: `${boxHeight}%`,
                }}
              ></div>
              <div
                className="absolute overflow-hidden rounded-b-md"
                 style={{
                  left: `${xMin * 100}%`,
                  top: `${yMin * 100}%`,
                  width: `${boxWidth}%`,
                  height: `${boxHeight}%`,
                }}
              >
                <div
                  className="absolute bottom-0 left-0 w-full bg-sky-500/50 backdrop-blur-sm transition-all duration-500 ease-in-out"
                  style={{ height: waterHeight }}
                ></div>
              </div>
            </div>
          )
        })}

        {/* Volume Overlay */}
        {detectedObjects.length > 0 && (
          <div className="absolute top-[12%] right-[5%] bg-primary/80 text-primary-foreground p-3 rounded-lg shadow-lg backdrop-blur-sm animate-fade-in">
            <p className="font-semibold text-lg">
              {displayVolume.toFixed(0)} {unit}
            </p>
            {confidenceScore !== null && (
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <ConfidenceIcon className={cn("h-4 w-4", confidenceColor)} />
                <span className={cn("font-medium", confidenceColor)}>
                  Confidence: {(confidenceScore * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {!isDetecting && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
          <p className="text-foreground text-lg font-medium">Detection Paused</p>
        </div>
      )}
    </div>
  );
});

CameraView.displayName = "CameraView";
