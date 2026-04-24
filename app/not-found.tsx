"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold tabular-nums text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-8">
          Page not found. It might have moved or never existed.
        </p>
        <Button asChild className="rounded-full gap-2">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            Back to app
          </Link>
        </Button>
      </div>
    </div>
  );
}
