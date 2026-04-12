"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { Translations } from "@/lib/i18n";
import { Loader2, CheckCircle2, MessageSquare, Lock, UserCircle2 } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
  onOpenAuth: () => void;
}

// Schema only validates subject + message — name/email come from the auth session
const schema = z.object({
  subject: z.string().min(3, "Min 3 characters"),
  message: z.string().min(10, "Min 10 characters").max(2000, "Max 2000 characters"),
});

export function FeedbackModal({ open, onClose, t, onOpenAuth }: FeedbackModalProps) {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const fb = t.feedback;

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { subject: "", message: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!user) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Name and email always come from the authenticated user — never from the form
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          subject: data.subject,
          message: data.message,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setServerError(json.error ?? "Error"); return; }
      setSent(true);
      reset();
    } catch {
      setServerError("Network error");
    } finally {
      setLoading(false);
    }
  });

  const handleClose = () => {
    setSent(false);
    setServerError("");
    onClose();
  };

  const handleOpenAuth = () => {
    handleClose();
    onOpenAuth();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/60">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold leading-tight">
                {fb.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {fb.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4">

          {/* ── NOT LOGGED IN ── */}
          {!user ? (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Lock className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">{fb.loginRequired}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  {fb.loginRequiredDesc}
                </p>
              </div>
              <div className="flex gap-3 w-full max-w-xs">
                <Button variant="outline" onClick={handleClose} className="flex-1">{fb.cancel}</Button>
                <Button onClick={handleOpenAuth} className="flex-1 gap-2">
                  <UserCircle2 className="w-4 h-4" />
                  {fb.loginBtn}
                </Button>
              </div>
            </div>

          /* ── SUCCESS ── */
          ) : sent ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{fb.successTitle}</h3>
                <p className="text-sm text-muted-foreground mt-1">{fb.successDesc}</p>
              </div>
              <Button onClick={handleClose} variant="outline" className="mt-2">{fb.close}</Button>
            </div>

          /* ── FORM (logged in) ── */
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">

              {/* Sender info — read only, from auth */}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/50 rounded-xl border border-border/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">{fb.from}</p>
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="fb-subject">{fb.subject}</Label>
                {/* Quick chips */}
                <div className="flex flex-wrap gap-1.5">
                  {(fb.subjects as readonly string[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setValue("subject", s)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Input
                  id="fb-subject"
                  placeholder={fb.subjectPlaceholder}
                  {...register("subject")}
                />
                {errors.subject && (
                  <p className="text-xs text-destructive">{errors.subject.message}</p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="fb-msg">{fb.message}</Label>
                <Textarea
                  id="fb-msg"
                  placeholder={fb.messagePlaceholder}
                  rows={5}
                  className="resize-none"
                  {...register("message")}
                />
                {errors.message && (
                  <p className="text-xs text-destructive">{errors.message.message}</p>
                )}
              </div>

              {serverError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  {serverError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  {fb.cancel}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {fb.send}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
