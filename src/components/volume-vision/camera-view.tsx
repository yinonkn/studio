"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type CameraViewProps = {
  liquidLevel: number; // 0-100
  volume: number;
  unit: "ml" | "oz";
  confidenceScore: number | null;
  isDetecting: boolean;
};

export function CameraView({
  liquidLevel,
  volume,
  unit,
  confidenceScore,
  isDetecting,
}: CameraViewProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description:
            "Please enable camera permissions in your browser settings to use this app.",
        });
      }
    };

    getCameraPermission();
  }, [toast]);
  
  const ozVolume = volume * 0.033814;
  const displayVolume = unit === 'oz' ? ozVolume : volume;

  const waterHeight = `${liquidLevel}%`;
  
  const confidenceColor = confidenceScore === null ? "text-muted-foreground" : confidenceScore > 0.7 ? "text-success" : confidenceScore > 0.4 ? "text-warning" : "text-danger";
  const ConfidenceIcon = confidenceScore === null ? AlertTriangle : confidenceScore > 0.7 ? CheckCircle2 : AlertTriangle;

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl bg-neutral-800 border-4 border-neutral-700">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

      {hasCameraPermission === false && (
        <div className="absolute inset-0 bg-background/90 flex items-center justify-center p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
              Please allow camera access in your browser settings to use this feature. You may need to refresh the page after granting permission.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {hasCameraPermission === null && (
        <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
            <p>Requesting camera permission...</p>
        </div>
      )}


      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isDetecting ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Bounding Box */}
        <div className="absolute top-[10%] left-[25%] w-1/2 h-[80%] border-2 border-accent rounded-lg shadow-lg transition-all duration-300"></div>

        {/* Liquid Simulation */}
        <div className="absolute bottom-[11%] left-[26%] w-[48%] h-[78%] overflow-hidden rounded-b-md">
            <div 
                className="absolute bottom-0 left-0 w-full bg-sky-500/50 backdrop-blur-sm transition-all duration-500 ease-in-out"
                style={{ height: waterHeight }}
            ></div>
        </div>

        {/* Volume Overlay */}
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
      </div>

      {!isDetecting && (
         <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
            <p className="text-foreground text-lg font-medium">Detection Paused</p>
        </div>
      )}
    </div>
  );
}
