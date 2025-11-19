"use client";

import React, { useEffect, useRef, useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
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
  isDetecting: boolean;
  facingMode: FacingMode;
  detectedObjects: DetectedObject[];
  onCameraPermissionChange: (hasPermission: boolean) => void;
};

export const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(({
  liquidLevel,
  volume,
  unit,
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
        style={{ perspective: "1000px" }}
      >
        {/* Bounding Boxes for detected objects */}
        {detectedObjects.map((obj, index) => {
          const [xMin, yMin, xMax, yMax] = obj.box;
          const boxWidth = (xMax - xMin) * 100;
          const boxHeight = (yMax - yMin) * 100;

          if (boxWidth <= 0 || boxHeight <= 0) return null;

          return (
            <div 
              key={index}
              className="absolute"
              style={{
                left: `${xMin * 100}%`,
                top: `${yMin * 100}%`,
                width: `${boxWidth}%`,
                height: `${boxHeight}%`,
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="w-full h-full border-2 border-accent/70 rounded-lg shadow-2xl"
                style={{
                  transform: 'translateZ(30px) rotateY(15deg)',
                  boxShadow: "0 15px 50px rgba(0, 180, 255, 0.3)",
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
