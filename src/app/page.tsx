"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

import { calculateVolumeConfidenceScore, VolumeConfidenceScoreInput } from "@/ai/flows/volume-confidence-score";
import { Header } from "@/components/volume-vision/header";
import { SettingsDialog } from "@/components/volume-vision/settings-dialog";
import { CameraView, FacingMode, DetectedObject } from "@/components/volume-vision/camera-view";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type Unit = "ml" | "oz";

const MAX_VOLUME_ML = 350; // Max volume of the glass in ml

export default function Home() {
  const [unit, setUnit] = useState<Unit>("ml");
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modelRef = useRef<cocossd.ObjectDetection | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // The liquid level is determined by the bounding box.
  const dynamicLiquidLevel = useMemo(() => {
    if (detectedObjects.length === 0) {
      return 0;
    }
    // Estimate liquid level based on the bounding box position.
    const glass = detectedObjects[0];
    const boxHeight = glass.box[3] - glass.box[1];
    // This is a simplification. A more accurate model would consider perspective.
    // Assuming the liquid level is proportional to the inverse of the top y-coordinate within the box.
    // A lower y_min (closer to top of screen) means a fuller glass.
    return Math.max(0, Math.min(100, 100 - (glass.box[1] / (1 - boxHeight)) * 100));

  }, [detectedObjects]);

  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready();
        const model = await cocossd.load();
        modelRef.current = model;
        toast({
          title: "Local AI model loaded",
          description: "Object detection is now running locally.",
        });
      } catch (error) {
        console.error("Failed to load model:", error);
        toast({
          variant: "destructive",
          title: "Model Load Error",
          description: "Could not load the local object detection model.",
        });
      }
    }
    loadModel();
  }, [toast]);

  const volumeInMl = useMemo(() => {
    return (dynamicLiquidLevel / 100) * MAX_VOLUME_ML;
  }, [dynamicLiquidLevel]);
  
  const runObjectDetection = useCallback(async () => {
    if (
      !modelRef.current ||
      !videoRef.current ||
      !videoRef.current.srcObject ||
      videoRef.current.readyState < 2 // Check if video is ready
    ) {
      if (detectedObjects.length > 0) setDetectedObjects([]);
      return;
    }
  
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
  
    try {
      const predictions = await modelRef.current.detect(video);
      const glasses: DetectedObject[] = predictions
        .filter(p => (p.class === 'cup' || p.class === 'wine glass') && p.score > 0.5)
        .map(p => ({
          label: p.class,
          // Convert TF bbox from [x, y, width, height] to our [x_min, y_min, x_max, y_max] normalized format
          box: [
            p.bbox[0] / video.videoWidth,
            p.bbox[1] / video.videoHeight,
            (p.bbox[0] + p.bbox[2]) / video.videoWidth,
            (p.bbox[1] + p.bbox[3]) / video.videoHeight,
          ],
        }));
      setDetectedObjects(glasses);
    } catch (error: any) {
      console.error("Failed to detect objects:", error);
      setDetectedObjects([]);
       toast({
        variant: "destructive",
        title: "Local AI Error",
        description: `Could not perform object detection: ${error.message}`,
      });
    }
  }, [toast, detectedObjects.length]);

  useEffect(() => {
    if (modelRef.current && hasCameraPermission) {
        detectionIntervalRef.current = setInterval(runObjectDetection, 1000); // Run detection every second
    } else {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }
        setDetectedObjects([]);
    }

    return () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
        }
    };
  }, [hasCameraPermission, runObjectDetection]);
  
  const handleUnitChange = (newUnit: Unit) => {
    setUnit(newUnit);
  }

  const handleFacingModeChange = (newMode: FacingMode) => {
    setFacingMode(newMode);
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <main className="flex-grow pt-16 flex items-center justify-center">
        <div className="w-full h-full p-4 flex items-center justify-center">
            {hasCameraPermission === false && (
            <Alert variant="destructive" className="max-w-md">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                Please allow camera access to use this feature. You may need to refresh the page.
                </AlertDescription>
            </Alert>
            )}
            <CameraView
              ref={videoRef}
              liquidLevel={dynamicLiquidLevel}
              volume={volumeInMl}
              unit={unit}
              confidenceScore={null}
              isDetecting={true}
              facingMode={facingMode}
              detectedObjects={detectedObjects}
              onCameraPermissionChange={setHasCameraPermission}
            />
        </div>
      </main>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setSettingsOpen}
        unit={unit}
        onUnitChange={handleUnitChange}
        facingMode={facingMode}
        onFacingModeChange={handleFacingModeChange}
      />
    </div>
  );
}
