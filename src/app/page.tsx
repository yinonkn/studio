"use client";

import { useState, useEffect, useMemo, useCallback, useTransition, useRef } from "react";
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

import { calculateVolumeConfidenceScore, VolumeConfidenceScoreInput } from "@/ai/flows/volume-confidence-score";
import { Header } from "@/components/volume-vision/header";
import { SettingsDialog } from "@/components/volume-vision/settings-dialog";
import { CameraView, FacingMode, DetectedObject } from "@/components/volume-vision/camera-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ScanLine } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type Unit = "ml" | "oz";

const MAX_VOLUME_ML = 350; // Max volume of the glass in ml

export default function Home() {
  const [liquidLevel, setLiquidLevel] = useState(50); // 0-100%
  const [unit, setUnit] = useState<Unit>("ml");
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isDetecting, setDetecting] = useState(true);
  
  const [confidence, setConfidence] = useState<{ score: number; reasoning: string } | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isAiPending, startAiTransition] = useTransition();

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modelRef = useRef<cocossd.ObjectDetection | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

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
    return (liquidLevel / 100) * MAX_VOLUME_ML;
  }, [liquidLevel]);

  const updateConfidence = useCallback(async (currentVolume: number) => {
    if (!isDetecting || detectedObjects.length === 0) {
        setConfidence(null);
        return;
    }
    
    startAiTransition(async () => {
      const input: VolumeConfidenceScoreInput = {
        glassShape: 'Cylinder',
        waterLineConsistency: `Water line is horizontal at ${liquidLevel.toFixed(0)}% full, which is consistent with a cylindrical glass.`,
        volumeEstimate: currentVolume,
      };

      try {
        const result = await calculateVolumeConfidenceScore(input);
        setConfidence({ score: result.confidenceScore, reasoning: result.reasoning });
      } catch (error: any) {
        console.error("Failed to get confidence score:", error);
        // This is a secondary feature, so we won't show a toast for this error
        // to avoid clutter, especially in offline scenarios.
        setConfidence(null);
      }
    });
  }, [isDetecting, liquidLevel, detectedObjects]);
  
  const runObjectDetection = useCallback(async () => {
    if (
      !isDetecting ||
      !modelRef.current ||
      !videoRef.current ||
      videoRef.current.readyState < 2 // Check if video is ready
    ) {
      if (detectedObjects.length > 0) setDetectedObjects([]);
      return;
    }
  
    const video = videoRef.current;
  
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
  }, [isDetecting, toast, detectedObjects.length]);

  useEffect(() => {
    if (isDetecting && modelRef.current && hasCameraPermission) {
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
  }, [isDetecting, hasCameraPermission, runObjectDetection]);


  useEffect(() => {
    updateConfidence(volumeInMl);
  }, [volumeInMl, detectedObjects.length, updateConfidence]);
  
  const handleLiquidLevelChange = (value: number[]) => {
    setLiquidLevel(value[0]);
  };
  
  const handleUnitChange = (newUnit: Unit) => {
    setUnit(newUnit);
  }

  const handleFacingModeChange = (newMode: FacingMode) => {
    setFacingMode(newMode);
  }

  const isSimulating = detectedObjects.length === 0;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-2 flex flex-col items-center gap-4">
               {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access to use this feature. You may need to refresh the page.
                  </AlertDescription>
                </Alert>
              )}
              <CameraView
                ref={videoRef}
                liquidLevel={liquidLevel}
                volume={volumeInMl}
                unit={unit}
                confidenceScore={confidence?.score ?? null}
                isDetecting={isDetecting}
                facingMode={facingMode}
                detectedObjects={detectedObjects}
                isSimulating={isSimulating}
                onCameraPermissionChange={setHasCameraPermission}
              />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Controls</CardTitle>
                  <CardDescription>
                    {isSimulating ? "Adjust parameters to simulate volume detection." : "Detection is live. Simulation is paused."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="detection-switch" className="flex items-center gap-2 font-medium">
                        <ScanLine className="h-5 w-5" />
                        Glass Detection
                    </Label>
                    <Switch
                      id="detection-switch"
                      checked={isDetecting}
                      onCheckedChange={setDetecting}
                      disabled={!hasCameraPermission}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="liquid-level" className="font-medium">Liquid Level: {liquidLevel}%</Label>
                    <Slider
                      id="liquid-level"
                      min={0}
                      max={100}
                      step={1}
                      value={[liquidLevel]}
                      onValueChange={handleLiquidLevelChange}
                      disabled={!isSimulating}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className={isAiPending || !confidence ? 'opacity-60' : ''}>
                 <CardHeader>
                   <CardTitle>AI Analysis</CardTitle>
                   <CardDescription>
                     Confidence score from the cloud AI model (requires internet).
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                    {(isAiPending && detectedObjects.length > 0) && <p className="text-sm text-muted-foreground">Analyzing...</p>}
                    {!isAiPending && confidence && (
                        <p className="text-sm">{confidence.reasoning}</p>
                    )}
                    {!isAiPending && !confidence && <p className="text-sm text-muted-foreground">{!isDetecting ? "Enable detection to see AI analysis." : hasCameraPermission ? "Point the camera at a glass." : "Camera not available."}</p>}
                 </CardContent>
              </Card>
            </div>

          </div>
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

    