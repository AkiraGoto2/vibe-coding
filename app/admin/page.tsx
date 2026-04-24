"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Users, MessageSquare, CheckCircle2, Clock,
  Search, Trash2, ChevronLeft, ChevronRight,
  ArrowLeft, ShieldCheck, Loader2, Mail,
  Dumbbell, Plus, Pencil, Eye, EyeOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedbackItem {
  id: string; name: string; email: string; subject: string;
  message: string; status: "new" | "read" | "resolved";
  createdAt: string;
  user?: { id: string; name: string; email: string; role: string } | null;
}

interface ExerciseItem {
  id: string; name: string; nameRu: string;
  description: string; descriptionRu: string;
  gifUrl: string; category: string; duration: number; isActive: boolean;
}

interface Stats {
  totalUsers: number; totalFeedback: number;
  newFeedback: number; resolvedFeedback: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  new:      "bg-blue-500/15 text-blue-400 border-blue-500/30",
  read:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/15 text-green-400 border-green-500/30",
};

// ─── Exercise Form Modal ───────────────────────────────────────────────────────

function ExerciseFormModal({
  exercise, onClose, onSaved, lang,
}: {
  exercise: ExerciseItem | null;
  onClose: () => void;
  onSaved: () => void;
  lang: "en" | "ru";
}) {
  const isEdit = !!exercise;
  const ru = lang === "ru";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: exercise?.name ?? "",
    nameRu: exercise?.nameRu ?? "",
    description: exercise?.description ?? "",
    descriptionRu: exercise?.descriptionRu ?? "",
    gifUrl: exercise?.gifUrl ?? "",
    category: exercise?.category ?? "stretch",
    duration: exercise?.duration ?? 45,
    isActive: exercise?.isActive ?? true,
  });

  const set = (k: string, v: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");

    const url = isEdit
      ? `/api/admin/exercises/${exercise!.id}`
      : "/api/admin/exercises";

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, duration: Number(form.duration) }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) { setError(json.error ?? "Error"); return; }
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? (ru ? "Редактировать упражнение" : "Edit Exercise") : (ru ? "Новое упражнение" : "New Exercise")}
          </DialogTitle>
          <DialogDescription>
            {ru ? "Заполните данные упражнения на двух языках" : "Fill exercise data in both languages"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* GIF URL + preview */}
          <div className="space-y-1.5">
            <Label>GIF URL</Label>
            <Input value={form.gifUrl} onChange={(e) => set("gifUrl", e.target.value)}
              placeholder="https://media.giphy.com/..." />
            {form.gifUrl && (
              <div className="mt-2 rounded-xl overflow-hidden bg-muted h-40">
                <img src={form.gifUrl} alt="preview" className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.opacity = "0.2"; }} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1.5">
              <Label>{ru ? "Категория" : "Category"}</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stretch">Stretch</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="relax">Relax</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Duration */}
            <div className="space-y-1.5">
              <Label>{ru ? "Длительность (сек)" : "Duration (sec)"}</Label>
              <Input type="number" min={10} max={300} value={form.duration}
                onChange={(e) => set("duration", e.target.value)} />
            </div>
          </div>

          {/* Name EN */}
          <div className="space-y-1.5">
            <Label>Name (English)</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="Neck Rolls" required />
          </div>
          {/* Description EN */}
          <div className="space-y-1.5">
            <Label>Description (English)</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Slowly roll your head..." rows={3} className="resize-none" required />
          </div>

          {/* Name RU */}
          <div className="space-y-1.5">
            <Label>Название (Русский)</Label>
            <Input value={form.nameRu} onChange={(e) => set("nameRu", e.target.value)}
              placeholder="Вращение шеи" />
          </div>
          {/* Description RU */}
          <div className="space-y-1.5">
            <Label>Описание (Русский)</Label>
            <Textarea value={form.descriptionRu} onChange={(e) => set("descriptionRu", e.target.value)}
              placeholder="Медленно вращайте головой..." rows={3} className="resize-none" />
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="w-4 h-4 rounded accent-primary" />
            <span className="text-sm">{ru ? "Активное (показывать пользователям)" : "Active (show to users)"}</span>
          </label>

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {ru ? "Отмена" : "Cancel"}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isEdit ? (ru ? "Сохранить" : "Save") : (ru ? "Создать" : "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const ru = language === "ru";

  const [tab, setTab] = useState<"feedback" | "exercises">("feedback");
  const [stats, setStats] = useState<Stats | null>(null);

  // Feedback state
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [feedbackPages, setFeedbackPages] = useState(1);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  // Exercise state
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [exerciseForm, setExerciseForm] = useState<ExerciseItem | "new" | null>(null);

  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) router.replace("/");
  }, [authLoading, user, isAdmin, router]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const fetchFeedback = useCallback(async () => {
    setLoadingData(true);
    const params = new URLSearchParams({
      page: String(feedbackPage), limit: "15",
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(search ? { q: search } : {}),
    });
    const res = await fetch(`/api/admin/feedback?${params}`);
    if (res.ok) {
      const data = await res.json();
      setFeedbackItems(data.items);
      setFeedbackTotal(data.total);
      setFeedbackPages(data.pages);
    }
    setLoadingData(false);
  }, [feedbackPage, statusFilter, search]);

  const fetchExercises = useCallback(async () => {
    setLoadingData(true);
    const res = await fetch("/api/admin/exercises?limit=50");
    if (res.ok) {
      const data = await res.json();
      setExercises(data.items);
    }
    setLoadingData(false);
  }, []);

  useEffect(() => { if (isAdmin) { fetchStats(); } }, [isAdmin, fetchStats]);
  useEffect(() => { if (isAdmin && tab === "feedback") fetchFeedback(); }, [isAdmin, tab, fetchFeedback]);
  useEffect(() => { if (isAdmin && tab === "exercises") fetchExercises(); }, [isAdmin, tab, fetchExercises]);
  useEffect(() => { setFeedbackPage(1); }, [search, statusFilter]);

  const updateStatus = async (id: string, status: "new" | "read" | "resolved") => {
    await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setFeedbackItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    if (selectedFeedback?.id === id) setSelectedFeedback((s) => s ? { ...s, status } : s);
    fetchStats();
  };

  const deleteFeedback = async (id: string) => {
    await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
    setFeedbackItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedFeedback?.id === id) setSelectedFeedback(null);
    fetchStats();
  };

  const deleteExercise = async (id: string) => {
    await fetch(`/api/admin/exercises/${id}`, { method: "DELETE" });
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleExerciseActive = async (ex: ExerciseItem) => {
    await fetch(`/api/admin/exercises/${ex.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ex.isActive }),
    });
    setExercises((prev) => prev.map((e) => e.id === ex.id ? { ...e, isActive: !e.isActive } : e));
  };

  const openFeedback = (item: FeedbackItem) => {
    setSelectedFeedback(item);
    if (item.status === "new") updateStatus(item.id, "read");
  };

  if (authLoading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const statCards = [
    { label: ru ? "Пользователей" : "Users", value: stats?.totalUsers ?? "—", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: ru ? "Сообщений" : "Messages", value: stats?.totalFeedback ?? "—", icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: ru ? "Новых" : "New", value: stats?.newFeedback ?? "—", icon: Clock, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: ru ? "Решено" : "Resolved", value: stats?.resolvedFeedback ?? "—", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
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
                <h1 className="font-semibold text-sm">{ru ? "Панель администратора" : "Admin Panel"}</h1>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">ADMIN</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
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

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
          {(["feedback", "exercises"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t === "feedback"
                ? (ru ? "Обратная связь" : "Feedback")
                : (ru ? "Упражнения" : "Exercises")}
            </button>
          ))}
        </div>

        {/* ── FEEDBACK TAB ── */}
        {tab === "feedback" && (
          <div className="flex gap-4 h-[calc(100vh-340px)] min-h-[400px]">
            {/* List */}
            <div className="flex flex-col flex-1 min-w-0 bg-card border border-border/60 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border/60 flex gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder={ru ? "Поиск..." : "Search..."} className="pl-8 h-8 text-sm"
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{ru ? "Все" : "All"}</SelectItem>
                    <SelectItem value="new">{ru ? "Новые" : "New"}</SelectItem>
                    <SelectItem value="read">{ru ? "Прочитано" : "Read"}</SelectItem>
                    <SelectItem value="resolved">{ru ? "Решено" : "Resolved"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border/40">
                {loadingData ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : feedbackItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 opacity-30" />
                    <p className="text-sm">{ru ? "Нет сообщений" : "No messages"}</p>
                  </div>
                ) : feedbackItems.map((item) => (
                  <button key={item.id} onClick={() => openFeedback(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${selectedFeedback?.id === item.id ? "bg-muted/60" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {item.status === "new" && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                          <p className={`text-sm truncate ${item.status === "new" ? "font-semibold" : "font-medium"}`}>{item.subject}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{item.name} · {item.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${STATUS_COLORS[item.status]}`}>
                          {item.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString(ru ? "ru-RU" : "en-US")}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {feedbackPages > 1 && (
                <div className="border-t border-border/60 px-4 py-2 flex items-center justify-between shrink-0">
                  <span className="text-xs text-muted-foreground">{feedbackTotal} {ru ? "всего" : "total"}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="w-7 h-7" disabled={feedbackPage <= 1} onClick={() => setFeedbackPage((p) => p - 1)}>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-xs tabular-nums w-12 text-center">{feedbackPage} / {feedbackPages}</span>
                    <Button variant="ghost" size="icon" className="w-7 h-7" disabled={feedbackPage >= feedbackPages} onClick={() => setFeedbackPage((p) => p + 1)}>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Detail panel */}
            <div className="w-96 shrink-0 bg-card border border-border/60 rounded-xl overflow-hidden flex flex-col">
              {selectedFeedback ? (
                <>
                  <div className="p-4 border-b border-border/60">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h2 className="font-semibold text-sm leading-snug flex-1">{selectedFeedback.subject}</h2>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{ru ? "Удалить?" : "Delete?"}</AlertDialogTitle>
                            <AlertDialogDescription>{ru ? "Отменить нельзя." : "This cannot be undone."}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{ru ? "Отмена" : "Cancel"}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteFeedback(selectedFeedback.id)} className="bg-destructive hover:bg-destructive/90">
                              {ru ? "Удалить" : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">{selectedFeedback.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{selectedFeedback.name}</p>
                        <a href={`mailto:${selectedFeedback.email}`}
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" />{selectedFeedback.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(selectedFeedback.createdAt).toLocaleString(ru ? "ru-RU" : "en-US")}
                      </span>
                      <Select value={selectedFeedback.status}
                        onValueChange={(v) => updateStatus(selectedFeedback.id, v as "new" | "read" | "resolved")}>
                        <SelectTrigger className="w-28 h-6 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">{ru ? "Новое" : "New"}</SelectItem>
                          <SelectItem value="read">{ru ? "Прочитано" : "Read"}</SelectItem>
                          <SelectItem value="resolved">{ru ? "Решено" : "Resolved"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedFeedback.message}</p>
                  </div>
                  <div className="p-3 border-t border-border/60 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                      onClick={() => updateStatus(selectedFeedback.id, "read")} disabled={selectedFeedback.status === "read"}>
                      {ru ? "Прочитано" : "Mark Read"}
                    </Button>
                    <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => updateStatus(selectedFeedback.id, "resolved")} disabled={selectedFeedback.status === "resolved"}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />{ru ? "Решено" : "Resolve"}
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
        )}

        {/* ── EXERCISES TAB ── */}
        {tab === "exercises" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {exercises.length} {ru ? "упражнений" : "exercises"} · {exercises.filter((e) => e.isActive).length} {ru ? "активных" : "active"}
              </p>
              <Button onClick={() => setExerciseForm("new")} className="gap-2 rounded-full">
                <Plus className="w-4 h-4" />
                {ru ? "Добавить" : "Add Exercise"}
              </Button>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {exercises.map((ex) => (
                  <div key={ex.id} className={`bg-card border rounded-xl overflow-hidden ${!ex.isActive ? "opacity-50" : "border-border/60"}`}>
                    {/* GIF preview */}
                    <div className="h-36 bg-muted overflow-hidden relative">
                      <img src={ex.gifUrl} alt={ex.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
                        ex.category === "stretch"  ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        ex.category === "strength" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                        ex.category === "cardio"   ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                                     "bg-green-500/20 text-green-400 border-green-500/30"}`}>
                        {ex.category}
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-0.5 text-xs text-white font-mono">
                        {ex.duration}s
                      </div>
                    </div>

                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{ex.name}</p>
                      {ex.nameRu && <p className="text-xs text-muted-foreground truncate">{ex.nameRu}</p>}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ex.description}</p>

                      <div className="flex items-center gap-1.5 mt-3">
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1"
                          onClick={() => setExerciseForm(ex)}>
                          <Pencil className="w-3 h-3" />{ru ? "Изменить" : "Edit"}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                          onClick={() => toggleExerciseActive(ex)}
                          title={ex.isActive ? (ru ? "Скрыть" : "Hide") : (ru ? "Показать" : "Show")}>
                          {ex.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{ru ? "Удалить упражнение?" : "Delete exercise?"}</AlertDialogTitle>
                              <AlertDialogDescription>{ex.name}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{ru ? "Отмена" : "Cancel"}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteExercise(ex.id)} className="bg-destructive hover:bg-destructive/90">
                                {ru ? "Удалить" : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}

                {exercises.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                    <Dumbbell className="w-10 h-10 opacity-20" />
                    <p className="text-sm">{ru ? "Упражнений нет. Добавьте первое!" : "No exercises yet. Add the first one!"}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exercise form modal */}
      {exerciseForm !== null && (
        <ExerciseFormModal
          exercise={exerciseForm === "new" ? null : exerciseForm}
          onClose={() => setExerciseForm(null)}
          onSaved={fetchExercises}
          lang={language}
        />
      )}
    </div>
  );
}
