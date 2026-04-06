"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings } from "lucide-react";

interface SettingsPanelProps {
  workDuration: number;
  breakDuration: number;
  onWorkDurationChange: (minutes: number) => void;
  onBreakDurationChange: (minutes: number) => void;
  autostart: boolean;
  onAutostartChange: (enabled: boolean) => void;
}

export function SettingsPanel({
  workDuration,
  breakDuration,
  onWorkDurationChange,
  onBreakDurationChange,
  autostart,
  onAutostartChange,
}: SettingsPanelProps) {
  const [localWorkDuration, setLocalWorkDuration] = useState(workDuration);
  const [localBreakDuration, setLocalBreakDuration] = useState(breakDuration);

  useEffect(() => {
    setLocalWorkDuration(workDuration);
  }, [workDuration]);

  useEffect(() => {
    setLocalBreakDuration(breakDuration);
  }, [breakDuration]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure your break reminder preferences
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          {/* Work Duration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="work-duration">Work Duration</Label>
              <span className="text-sm font-medium text-primary">
                {localWorkDuration} minutes
              </span>
            </div>
            <Slider
              id="work-duration"
              min={15}
              max={120}
              step={5}
              value={[localWorkDuration]}
              onValueChange={(value) => setLocalWorkDuration(value[0])}
              onValueCommit={(value) => onWorkDurationChange(value[0])}
            />
            <p className="text-xs text-muted-foreground">
              How long you want to work before taking a break
            </p>
          </div>

          {/* Break Duration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="break-duration">Break Duration</Label>
              <span className="text-sm font-medium text-primary">
                {localBreakDuration} minutes
              </span>
            </div>
            <Slider
              id="break-duration"
              min={5}
              max={30}
              step={1}
              value={[localBreakDuration]}
              onValueChange={(value) => setLocalBreakDuration(value[0])}
              onValueCommit={(value) => onBreakDurationChange(value[0])}
            />
            <p className="text-xs text-muted-foreground">
              Duration of your exercise break
            </p>
          </div>

          {/* Autostart */}
          <div className="flex items-center justify-between py-4 border-t border-border">
            <div className="space-y-0.5">
              <Label htmlFor="autostart">Start with System</Label>
              <p className="text-xs text-muted-foreground">
                Automatically start when your computer boots
              </p>
            </div>
            <Switch
              id="autostart"
              checked={autostart}
              onCheckedChange={onAutostartChange}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
