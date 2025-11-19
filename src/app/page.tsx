"use client";

import { useState, useEffect, useMemo, useCallback, useTransition } from "react";
import { calculateVolumeConfidenceScore, VolumeConfidenceScoreInput } from "@/ai/flows/volume-confidence-score";
import { Header } from "@/components/volume-vision/header";
import { SettingsDialog } from "@/components/volume-vision/settings-dialog";
import { CameraView, FacingMode } from "@/components/volume-vision/camera-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ScanLine } from "lucide-react";

export type Unit = "ml" | "oz";

const MAX_VOLUME_ML = 350; // Max volume of the glass in ml

export default function Home() {
  const [liquidLevel, setLiquidLevel] = useState(50); // 0-100%
  const [unit, setUnit] = useState<Unit>("ml");
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isDetecting, setDetecting] = useState(true);
  
  const [confidence, setConfidence] = useState<{ score: number; reasoning: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const { toast } = useToast();

  const volumeInMl = useMemo(() => {
    return (liquidLevel / 100) * MAX_VOLUME_ML;
  }, [liquidLevel]);

  const updateConfidence = useCallback(async (currentVolume: number) => {
    if (!isDetecting) {
        setConfidence(null);
        return;
    }
    
    const input: VolumeConfidenceScoreInput = {
      glassShape: 'Cylinder',
      waterLineConsistency: `Water line is horizontal at ${liquidLevel.toFixed(0)}% full, which is consistent with a cylindrical glass.`,
      volumeEstimate: currentVolume,
    };

    try {
      const result = await calculateVolumeConfidenceScore(input);
      setConfidence({ score: result.confidenceScore, reasoning: result.reasoning });
    } catch (error) {
      console.error("Failed to get confidence score:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not calculate confidence score.",
      });
      setConfidence(null);
    }
  }, [isDetecting, liquidLevel, toast]);
  
  useEffect(() => {
    startTransition(() => {
      updateConfidence(volumeInMl);
    });
  }, [volumeInMl, updateConfidence]);
  
  const handleLiquidLevelChange = (value: number[]) => {
    setLiquidLevel(value[0]);
  };
  
  const handleUnitChange = (newUnit: Unit) => {
    setUnit(newUnit);
  }

  const handleFacingModeChange = (newMode: FacingMode) => {
    setFacingMode(newMode);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-2 flex justify-center">
              <CameraView
                liquidLevel={liquidLevel}
                volume={volumeInMl}
                unit={unit}
                confidenceScore={confidence?.score ?? null}
                isDetecting={isDetecting}
                facingMode={facingMode}
              />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Controls</CardTitle>
                  <CardDescription>
                    Adjust the parameters to simulate volume detection.
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
                      disabled={!isDetecting}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className={isPending || !confidence ? 'opacity-60' : ''}>
                 <CardHeader>
                   <CardTitle>AI Analysis</CardTitle>
                   <CardDescription>
                     Confidence score and reasoning from the AI model.
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                    {isPending && <p className="text-sm text-muted-foreground">Calculating confidence...</p>}
                    {!isPending && confidence && (
                        <p className="text-sm">{confidence.reasoning}</p>
                    )}
                    {!isPending && !confidence && <p className="text-sm text-muted-foreground">Enable detection to see AI analysis.</p>}
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
}
