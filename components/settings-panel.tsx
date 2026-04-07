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
import { Settings, Globe, Sun, Moon, Monitor } from "lucide-react";
import { Language, Translations } from "@/lib/i18n";
import { useTheme } from "next-themes";

interface SettingsPanelProps {
  workDuration: number;
  breakDuration: number;
  onWorkDurationChange: (minutes: number) => void;
  onBreakDurationChange: (minutes: number) => void;
  autostart: boolean;
  onAutostartChange: (enabled: boolean) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  t: Translations;
}

export function SettingsPanel({
  workDuration,
  breakDuration,
  onWorkDurationChange,
  onBreakDurationChange,
  autostart,
  onAutostartChange,
  language,
  onLanguageChange,
  t,
}: SettingsPanelProps) {
  const [localWork, setLocalWork] = useState(workDuration);
  const [localBreak, setLocalBreak] = useState(breakDuration);
  const { theme, setTheme } = useTheme();

  useEffect(() => { setLocalWork(workDuration); }, [workDuration]);
  useEffect(() => { setLocalBreak(breakDuration); }, [breakDuration]);

  const s = t.settings;

  const themeOptions = [
    { value: "light", label: s.themeLight, icon: Sun },
    { value: "dark", label: s.themeDark, icon: Moon },
    { value: "system", label: s.themeSystem, icon: Monitor },
  ] as const;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent className="w-80 sm:w-96 overflow-y-auto">
        <SheetHeader className="pb-6 border-b border-border">
          <SheetTitle className="text-lg">{s.title}</SheetTitle>
          <SheetDescription className="text-sm">{s.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">

          {/* ── TIMERS ── */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Timer
            </h3>

            {/* Work Duration */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{s.workDuration}</Label>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {localWork} {s.minutes}
                </span>
              </div>
              <Slider
                min={15}
                max={120}
                step={5}
                value={[localWork]}
                onValueChange={(v) => setLocalWork(v[0])}
                onValueCommit={(v) => onWorkDurationChange(v[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>15 {s.minutes}</span>
                <span>120 {s.minutes}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.workHint}</p>
            </div>

            {/* Break Duration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{s.breakDuration}</Label>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {localBreak} {s.minutes}
                </span>
              </div>
              <Slider
                min={2}
                max={30}
                step={1}
                value={[localBreak]}
                onValueChange={(v) => setLocalBreak(v[0])}
                onValueCommit={(v) => onBreakDurationChange(v[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2 {s.minutes}</span>
                <span>30 {s.minutes}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.breakHint}</p>
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* ── APPEARANCE ── */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              {s.theme}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-medium transition-all ${
                    theme === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-border/80 hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* ── LANGUAGE ── */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              <Globe className="inline h-3 w-3 mr-1" />
              {s.language}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(["en", "ru"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                    language === lang
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-border/80 hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <span>{lang === "en" ? "🇬🇧" : "🇷🇺"}</span>
                  {lang === "en" ? "English" : "Русский"}
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* ── SYSTEM ── */}
          <section>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{s.autostart}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{s.autostartHint}</p>
              </div>
              <Switch
                checked={autostart}
                onCheckedChange={onAutostartChange}
              />
            </div>
          </section>

        </div>
      </SheetContent>
    </Sheet>
  );
}
