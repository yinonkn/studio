"use client";

import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

type CameraViewProps = {
  liquidLevel: number; // 0-100
  volume: number;
  unit: "ml" | "oz";
  confidenceScore: number | null;
  isDetecting: boolean;
};

const glassPlaceholder = PlaceHolderImages.find(
  (img) => img.id === "glass-of-water"
);

export function CameraView({
  liquidLevel,
  volume,
  unit,
  confidenceScore,
  isDetecting,
}: CameraViewProps) {
  const ozVolume = volume * 0.033814;
  const displayVolume = unit === 'oz' ? ozVolume : volume;

  const waterHeight = `${liquidLevel}%`;
  
  const confidenceColor = confidenceScore === null ? "text-muted-foreground" : confidenceScore > 0.7 ? "text-success" : confidenceScore > 0.4 ? "text-warning" : "text-danger";
  const ConfidenceIcon = confidenceScore === null ? AlertTriangle : confidenceScore > 0.7 ? CheckCircle2 : AlertTriangle;

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl bg-neutral-800 border-4 border-neutral-700">
      {glassPlaceholder ? (
        <Image
          src={glassPlaceholder.imageUrl}
          alt={glassPlaceholder.description}
          fill
          className="object-cover"
          data-ai-hint={glassPlaceholder.imageHint}
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Image not found</p>
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
