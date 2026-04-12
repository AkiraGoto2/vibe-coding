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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Translations } from "@/lib/i18n";
import { Eye, EyeOff, Loader2, UserCircle2 } from "lucide-react";
// framer-motion not used inside Dialog to avoid DOM InsertBefore errors

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  t: Translations;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z
  .object({
    name: z.string().min(2, "Min 2 characters"),
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(8, "Min 8 characters")
      .regex(/[A-Z]/, "Needs uppercase letter")
      .regex(/[0-9]/, "Needs a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function AuthModal({ open, onClose, t }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const auth = t.auth;

  const loginForm = useForm({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm({ resolver: zodResolver(registerSchema) });

  const handleLogin = loginForm.handleSubmit(async (data) => {
    setLoading(true);
    setServerError("");
    const res = await login(data.email, data.password);
    setLoading(false);
    if (res.error) { setServerError(res.error); return; }
    onClose();
  });

  const handleRegister = registerForm.handleSubmit(async (data) => {
    setLoading(true);
    setServerError("");
    const res = await register(data.name, data.email, data.password, data.confirmPassword);
    setLoading(false);
    if (res.error) { setServerError(res.error); return; }
    onClose();
  });

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setServerError("");
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {/*
        FIX: DialogTitle is ALWAYS rendered (required by Radix for accessibility).
        We put it in DialogHeader so it's visible and correct.
        The tabs below are plain buttons, not replacing the semantic title.
      */}
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/60">
        {/* Accessible header — required by Radix */}
        <DialogHeader className="sr-only">
          <DialogTitle>
            {mode === "login" ? auth.login : auth.register}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Sign in to sync your settings"
              : "Create an account to sync your settings"}
          </DialogDescription>
        </DialogHeader>

        {/* Visual tab row */}
        <div className="flex border-b border-border" role="tablist" aria-label="Auth mode">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                mode === m
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "login" ? auth.login : auth.register}
            </button>
          ))}
        </div>

        <div className="p-6">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle2 className="w-7 h-7 text-primary" />
            </div>
          </div>

          <div>
            {mode === "login" ? (
              <form
                onSubmit={handleLogin}
                className="space-y-4 animate-in fade-in duration-150"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="l-email">{auth.email}</Label>
                  <Input
                    id="l-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {loginForm.formState.errors.email.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="l-pass">{auth.password}</Label>
                  <div className="relative">
                    <Input
                      id="l-pass"
                      type={showPass ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...loginForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {serverError && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    {serverError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {auth.loginBtn}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {auth.noAccount}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="text-primary hover:underline font-medium"
                  >
                    {auth.registerLink}
                  </button>
                </p>
              </form>
            ) : (
              <form
                onSubmit={handleRegister}
                className="space-y-4 animate-in fade-in duration-150"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="r-name">{auth.name}</Label>
                  <Input
                    id="r-name"
                    autoComplete="name"
                    placeholder="Alex Smith"
                    {...registerForm.register("name")}
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {registerForm.formState.errors.name.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="r-email">{auth.email}</Label>
                  <Input
                    id="r-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {registerForm.formState.errors.email.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="r-pass">{auth.password}</Label>
                  <div className="relative">
                    <Input
                      id="r-pass"
                      type={showPass ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...registerForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {registerForm.formState.errors.password.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="r-confirm">{auth.confirmPassword}</Label>
                  <Input
                    id="r-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...registerForm.register("confirmPassword")}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {registerForm.formState.errors.confirmPassword.message as string}
                    </p>
                  )}
                </div>

                {serverError && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    {serverError}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {auth.registerBtn}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {auth.hasAccount}{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    {auth.loginLink}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
