"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Translations } from "@/lib/i18n";
import { Eye, EyeOff, Loader2, UserCircle2, Mail, RefreshCw, CheckCircle2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
}

type Screen = "login" | "register" | "verify";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const registerSchema = z.object({
  name: z.string().min(2, "Min 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 chars").regex(/[A-Z]/, "Needs uppercase").regex(/[0-9]/, "Needs a number"),
  confirmPassword: z.string(),
  consent: z.boolean().refine(v => v === true, { message: "Необходимо принять условия" }),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });
const verifySchema = z.object({ code: z.string().length(6, "6-digit code").regex(/^\d+$/, "Digits only") });

export function AuthModal({ open, onClose, t }: AuthModalProps) {
  const { login, register } = useAuth();
  const [screen, setScreen] = useState<Screen>("login");
  const [pendingEmail, setPendingEmail] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const auth = t.auth;

  const loginForm = useForm({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm({ resolver: zodResolver(registerSchema) });
  const verifyForm = useForm({ resolver: zodResolver(verifySchema) });

  const reset = (s: Screen) => {
    setScreen(s); setServerError(""); setLoading(false);
    loginForm.reset(); registerForm.reset(); verifyForm.reset();
  };

  const handleLogin = loginForm.handleSubmit(async (data) => {
    setLoading(true); setServerError("");
    const res = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (json.requiresVerification) {
        setPendingEmail(json.email ?? data.email);
        setScreen("verify");
        return;
      }
      setServerError(json.error ?? "Login failed");
      return;
    }
    // Cookie is set. Refresh auth context by re-fetching /api/auth/me
    const meRes = await fetch("/api/auth/me");
    if (meRes.ok) {
      const meData = await meRes.json();
      if (meData.user) {
        // Trigger a lightweight page refresh to update React context
        onClose();
        // Force a soft navigation refresh without full page reload
        window.dispatchEvent(new Event("auth-changed"));
        return;
      }
    }
    onClose();
  });

  const handleRegister = registerForm.handleSubmit(async (data) => {
    setLoading(true); setServerError("");
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setServerError(json.error ?? "Registration failed"); return; }
    setPendingEmail(data.email);
    setScreen("verify");
  });

  const handleVerify = verifyForm.handleSubmit(async (data) => {
    setLoading(true); setServerError("");
    const res = await fetch("/api/auth/verify-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingEmail, code: data.code }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setServerError(json.error ?? "Invalid code"); return; }
    // Session cookie is now set by the server. Reload to pick it up.
    // Using replace() so the user can't go "back" to the verify screen.
    onClose();
    window.location.replace("/");
  });

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    await fetch("/api/auth/resend-code", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pendingEmail }),
    });
    const interval = setInterval(() => {
      setResendCooldown((prev) => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
  };

  const titleText =
    screen === "verify" ? auth.verifyTitle :
    screen === "login"  ? auth.login : auth.register;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/60">
        <DialogHeader className="sr-only">
          <DialogTitle>{titleText}</DialogTitle>
          <DialogDescription>
            {screen === "verify" ? "Enter the 6-digit code sent to your email" : "Authenticate"}
          </DialogDescription>
        </DialogHeader>

        {/* Tab row — only for login/register */}
        {screen !== "verify" && (
          <div className="flex border-b border-border" role="tablist">
            {(["login", "register"] as const).map((m) => (
              <button key={m} role="tab" aria-selected={screen === m}
                onClick={() => reset(m)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  screen === m ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                {m === "login" ? auth.login : auth.register}
              </button>
            ))}
          </div>
        )}

        <div className="p-6">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              {screen === "verify"
                ? <Mail className="w-7 h-7 text-primary" />
                : <UserCircle2 className="w-7 h-7 text-primary" />}
            </div>
          </div>

          {/* ── VERIFY SCREEN ── */}
          {screen === "verify" && (
            <div>
              <div className="text-center mb-6">
                <h2 className="font-semibold text-base">{auth.verifyTitle}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {auth.verifyDesc} <span className="font-medium text-foreground">{pendingEmail}</span>
                </p>
              </div>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">{auth.verifyCode}</Label>
                  <Input
                    id="otp" inputMode="numeric" autoComplete="one-time-code"
                    maxLength={6} placeholder="000000"
                    className="text-center text-2xl tracking-widest font-mono h-14"
                    {...verifyForm.register("code")}
                  />
                  {verifyForm.formState.errors.code && (
                    <p className="text-xs text-destructive">{verifyForm.formState.errors.code.message}</p>
                  )}
                </div>

                {serverError && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{serverError}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {auth.verifyBtn}
                </Button>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <button type="button" onClick={() => reset("register")} className="hover:text-foreground">
                    ← {auth.register}
                  </button>
                  <button
                    type="button" onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="flex items-center gap-1 hover:text-foreground disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {resendCooldown > 0 ? `${auth.resendIn} ${resendCooldown}s` : auth.resend}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── LOGIN SCREEN ── */}
          {screen === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="l-email">{auth.email}</Label>
                <Input id="l-email" type="email" autoComplete="email"
                  placeholder="you@example.com" {...loginForm.register("email")} />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message as string}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="l-pass">{auth.password}</Label>
                <div className="relative">
                  <Input id="l-pass" type={showPass ? "text" : "password"}
                    autoComplete="current-password" placeholder="••••••••"
                    {...loginForm.register("password")} />
                  <button type="button" onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {serverError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{serverError}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {auth.loginBtn}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {auth.noAccount}{" "}
                <button type="button" onClick={() => reset("register")}
                  className="text-primary hover:underline font-medium">{auth.registerLink}</button>
              </p>
            </form>
          )}

          {/* ── REGISTER SCREEN ── */}
          {screen === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="r-name">{auth.name}</Label>
                <Input id="r-name" autoComplete="name" placeholder="Alex Smith"
                  {...registerForm.register("name")} />
                {registerForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.name.message as string}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-email">{auth.email}</Label>
                <Input id="r-email" type="email" autoComplete="email"
                  placeholder="you@example.com" {...registerForm.register("email")} />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.email.message as string}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-pass">{auth.password}</Label>
                <div className="relative">
                  <Input id="r-pass" type={showPass ? "text" : "password"}
                    autoComplete="new-password" placeholder="••••••••"
                    {...registerForm.register("password")} />
                  <button type="button" onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.password.message as string}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-confirm">{auth.confirmPassword}</Label>
                <Input id="r-confirm" type="password" autoComplete="new-password"
                  placeholder="••••••••" {...registerForm.register("confirmPassword")} />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message as string}</p>
                )}
              </div>
              {serverError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{serverError}</p>
              )}
              {/* 152-ФЗ: явное согласие на обработку ПД */}
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 w-4 h-4 rounded accent-primary shrink-0"
                  {...registerForm.register("consent", { required: "Необходимо принять условия" })}
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Я соглашаюсь с{" "}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline underline-offset-2">
                    политикой конфиденциальности
                  </a>{" "}
                  и даю согласие на обработку персональных данных в соответствии с 152-ФЗ
                </span>
              </label>
              {registerForm.formState.errors.consent && (
                <p className="text-xs text-destructive">{registerForm.formState.errors.consent.message as string}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {auth.registerBtn}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {auth.hasAccount}{" "}
                <button type="button" onClick={() => reset("login")}
                  className="text-primary hover:underline font-medium">{auth.loginLink}</button>
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
