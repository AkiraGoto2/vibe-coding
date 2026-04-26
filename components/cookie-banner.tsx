"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const COOKIE_KEY = "br_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner only if user hasn't consented yet
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Мы используем cookie</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Только технически необходимые cookie для авторизации. Никакой рекламы и аналитики.{" "}
              <Link href="/privacy" className="text-primary hover:underline underline-offset-2">
                Политика конфиденциальности
              </Link>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={accept} className="flex-1 h-8 text-xs rounded-full">
            Принять
          </Button>
          <Button size="sm" variant="outline" onClick={accept} className="flex-1 h-8 text-xs rounded-full">
            Только необходимые
          </Button>
        </div>
      </div>
    </div>
  );
}
