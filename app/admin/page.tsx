"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users, MessageSquare, CheckCircle2, Clock,
  Search, Trash2, ChevronLeft, ChevronRight,
  ArrowLeft, ShieldCheck, Loader2, Mail,
} from "lucide-react";

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "resolved";
  createdAt: string;
  user?: { id: string; name: string; email: string; role: string } | null;
}

interface Stats {
  totalUsers: number;
  totalFeedback: number;
  newFeedback: number;
  resolvedFeedback: number;
}

const STATUS_COLORS = {
  new:      "bg-blue-500/15 text-blue-400 border-blue-500/30",
  read:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/15 text-green-400 border-green-500/30",
};

const STATUS_LABELS = {
  new:      { en: "New",      ru: "Новое" },
  read:     { en: "Read",     ru: "Прочитано" },
  resolved: { en: "Resolved", ru: "Решено" },
};

export default function AdminPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const [stats, setStats]           = useState<Stats | null>(null);
  const [items, setItems]           = useState<FeedbackItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected]     = useState<FeedbackItem | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const ru = language === "ru";

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [authLoading, user, isAdmin, router]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchFeedback = useCallback(async () => {
    setLoadingData(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "15",
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(search ? { q: search } : {}),
    });
    const res = await fetch(`/api/admin/feedback?${params}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoadingData(false);
  }, [page, statusFilter, search]);

  useEffect(() => { if (isAdmin) { fetchStats(); } }, [isAdmin, fetchStats]);
  useEffect(() => { if (isAdmin) { fetchFeedback(); } }, [isAdmin, fetchFeedback]);

  // Debounce search
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const updateStatus = async (id: string, status: "new" | "read" | "resolved") => {
    await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s);
    fetchStats();
  };

  const deleteFeedback = async (id: string) => {
    await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
    setTotal((t) => t - 1);
    fetchStats();
  };

  const openItem = (item: FeedbackItem) => {
    setSelected(item);
    // Auto-mark as read when opened
    if (item.status === "new") updateStatus(item.id, "read");
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    {
      label: ru ? "Всего пользователей" : "Total Users",
      value: stats?.totalUsers ?? "—",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: ru ? "Все сообщения" : "Total Feedback",
      value: stats?.totalFeedback ?? "—",
      icon: MessageSquare,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: ru ? "Новые" : "New",
      value: stats?.newFeedback ?? "—",
      icon: Clock,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: ru ? "Решено" : "Resolved",
      value: stats?.resolvedFeedback ?? "—",
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── TOP BAR ── */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => router.push("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-sm leading-tight">
                  {ru ? "Панель администратора" : "Admin Panel"}
                </h1>
                <p className="text-xs text-muted-foreground leading-tight">{user?.email}</p>
              </div>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
            ADMIN
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN PANEL ── */}
        <div className="flex gap-4 h-[calc(100vh-240px)] min-h-[500px]">

          {/* LEFT — list */}
          <div className="flex flex-col flex-1 min-w-0 bg-card border border-border/60 rounded-xl overflow-hidden">

            {/* Toolbar */}
            <div className="p-3 border-b border-border/60 flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder={ru ? "Поиск..." : "Search..."}
                  className="pl-8 h-8 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{ru ? "Все" : "All"}</SelectItem>
                  <SelectItem value="new">{ru ? "Новые" : "New"}</SelectItem>
                  <SelectItem value="read">{ru ? "Прочитанные" : "Read"}</SelectItem>
                  <SelectItem value="resolved">{ru ? "Решённые" : "Resolved"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {loadingData ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 opacity-30" />
                  <p className="text-sm">{ru ? "Нет сообщений" : "No messages"}</p>
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openItem(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${
                      selected?.id === item.id ? "bg-muted/60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {item.status === "new" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          )}
                          <p className={`text-sm truncate ${item.status === "new" ? "font-semibold" : "font-medium"}`}>
                            {item.subject}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{item.name} · {item.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${STATUS_COLORS[item.status]}`}>
                          {STATUS_LABELS[item.status][language]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString(language === "ru" ? "ru-RU" : "en-US")}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="border-t border-border/60 px-4 py-2 flex items-center justify-between shrink-0">
                <span className="text-xs text-muted-foreground">
                  {total} {ru ? "всего" : "total"}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="w-7 h-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs tabular-nums w-12 text-center">{page} / {pages}</span>
                  <Button variant="ghost" size="icon" className="w-7 h-7" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — detail */}
          <div className="w-96 shrink-0 bg-card border border-border/60 rounded-xl overflow-hidden flex flex-col">
            {selected ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-border/60">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="font-semibold text-sm leading-snug flex-1">{selected.subject}</h2>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{ru ? "Удалить сообщение?" : "Delete message?"}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {ru ? "Это действие нельзя отменить." : "This action cannot be undone."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{ru ? "Отмена" : "Cancel"}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteFeedback(selected.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {ru ? "Удалить" : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Sender info */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {selected.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{selected.name}</p>
                      <a
                        href={`mailto:${selected.email}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                      >
                        <Mail className="w-3 h-3 shrink-0" />
                        {selected.email}
                      </a>
                    </div>
                    {selected.user && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                        {selected.user.role === "ADMIN" ? "Admin" : ru ? "Польз." : "User"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(selected.createdAt).toLocaleString(language === "ru" ? "ru-RU" : "en-US")}
                    </span>
                    <Select
                      value={selected.status}
                      onValueChange={(v) => updateStatus(selected.id, v as "new" | "read" | "resolved")}
                    >
                      <SelectTrigger className="w-28 h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">{ru ? "Новое" : "New"}</SelectItem>
                        <SelectItem value="read">{ru ? "Прочитано" : "Read"}</SelectItem>
                        <SelectItem value="resolved">{ru ? "Решено" : "Resolved"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Message body */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </p>
                </div>

                {/* Quick actions */}
                <div className="p-3 border-t border-border/60 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => updateStatus(selected.id, "read")}
                    disabled={selected.status === "read"}
                  >
                    {ru ? "Прочитано" : "Mark Read"}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => updateStatus(selected.id, "resolved")}
                    disabled={selected.status === "resolved"}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {ru ? "Решено" : "Resolve"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <MessageSquare className="w-12 h-12 opacity-20" />
                <p className="text-sm">{ru ? "Выберите сообщение" : "Select a message"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
