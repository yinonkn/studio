"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Unit } from '@/app/page';
import type { FacingMode } from './camera-view';
import { Separator } from "../ui/separator";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
  facingMode: FacingMode;
  onFacingModeChange: (mode: FacingMode) => void;
};

export function SettingsDialog({
  open,
  onOpenChange,
  unit,
  onUnitChange,
  facingMode,
  onFacingModeChange,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Adjust your application preferences here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unit
            </Label>
            <RadioGroup
              id="unit"
              value={unit}
              onValueChange={(value) => onUnitChange(value as Unit)}
              className="col-span-3 flex items-center gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ml" id="ml" />
                <Label htmlFor="ml">Milliliters (mL)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oz" id="oz" />
                <Label htmlFor="oz">Ounces (oz)</Label>
              </div>
            </RadioGroup>
          </div>
          <Separator />
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="camera" className="text-right">
              Camera
            </Label>
            <RadioGroup
              id="camera"
              value={facingMode}
              onValueChange={(value) => onFacingModeChange(value as FacingMode)}
              className="col-span-3 flex items-center gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="environment" id="environment" />
                <Label htmlFor="environment">Main</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user">Selfie</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
