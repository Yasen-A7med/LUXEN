import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Users, Loader2, Image, Link, X, Trash2 } from "lucide-react";
import { getEmployees, getChat, sendChatMessage, clearChat, type Employee, type ChatMsg } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;

function isImageUrl(url: string) {
  return IMAGE_EXTS.test(url) || url.includes("imgur.com") || url.includes("i.ibb.co") || url.includes("cloudinary.com");
}

function MessageBubble({ msg, senderName }: { msg: ChatMsg; senderName: string }) {
  const isAdmin = msg.isFromAdmin;
  const bubbleClass = `max-w-[75%] rounded-2xl px-4 py-2.5 text-sm space-y-1.5 ${
    isAdmin
      ? "bg-primary text-primary-foreground rounded-br-sm"
      : "bg-muted text-foreground rounded-bl-sm"
  }`;
  const timeClass = `text-[10px] mt-1 ${isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"}`;
  const time = new Date(msg.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
      <div className={bubbleClass}>
        <p className="text-[10px] font-semibold opacity-70">{isAdmin ? "الإدارة" : senderName}</p>

        {msg.mediaType === "image" && msg.mediaUrl ? (
          <div className="space-y-1">
            <img
              src={msg.mediaUrl}
              alt={msg.message || "صورة"}
              className="rounded-xl max-w-full max-h-60 object-cover border border-white/20"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {msg.message && <p className="text-xs opacity-80">{msg.message}</p>}
          </div>
        ) : msg.mediaType === "link" && msg.mediaUrl ? (
          <a
            href={msg.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 p-2 rounded-xl border ${
              isAdmin ? "border-white/20 bg-white/10 hover:bg-white/20" : "border-border bg-background/50 hover:bg-background"
            } transition-colors`}
          >
            <Link className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-xs truncate">{msg.message || msg.mediaUrl}</p>
              <p className="text-[10px] opacity-60 truncate" dir="ltr">{msg.mediaUrl}</p>
            </div>
          </a>
        ) : (
          <p className="leading-relaxed">{msg.message}</p>
        )}

        <p className={timeClass}>{time}</p>
      </div>
    </div>
  );
}

type MediaMode = "text" | "image" | "link";

function ChatPanel({ employee }: { employee: Employee }) {
  const [text, setText] = useState("");
  const [mediaMode, setMediaMode] = useState<MediaMode>("text");
  const [mediaUrl, setMediaUrl] = useState("");
  const [imagePreviewOk, setImagePreviewOk] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const empIdStr = String(employee.id);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat", empIdStr],
    queryFn: () => getChat(empIdStr),
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: ({ message, mType, mUrl }: { message: string; mType: string; mUrl?: string }) =>
      sendChatMessage(empIdStr, message, true, mType, mUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", empIdStr] });
      setText(""); setMediaUrl(""); setMediaMode("text"); setImagePreviewOk(false);
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const clearMutation = useMutation({
    mutationFn: () => clearChat(empIdStr),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", empIdStr] });
      toast({ title: "تم مسح المحادثة" });
    },
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const canSend = () => {
    if (sendMutation.isPending) return false;
    if (mediaMode === "text") return text.trim().length > 0;
    if (mediaMode === "image") return mediaUrl.trim().length > 0;
    if (mediaMode === "link") return mediaUrl.trim().length > 0;
    return false;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend()) return;
    if (mediaMode === "text") {
      sendMutation.mutate({ message: text.trim(), mType: "text" });
    } else if (mediaMode === "image") {
      sendMutation.mutate({ message: text.trim(), mType: "image", mUrl: mediaUrl.trim() });
    } else if (mediaMode === "link") {
      sendMutation.mutate({ message: text.trim(), mType: "link", mUrl: mediaUrl.trim() });
    }
  };

  const toggleMode = (mode: MediaMode) => {
    setMediaMode((prev) => (prev === mode ? "text" : mode));
    setMediaUrl("");
    setImagePreviewOk(false);
  };

  return (
    <Card className="flex-1 flex flex-col border-border bg-card overflow-hidden h-full">
      <div className="p-4 border-b border-border bg-muted/10 flex items-center gap-3 shrink-0">
        <Avatar className="h-9 w-9 border border-primary/30">
          <AvatarFallback className="bg-primary/10 text-primary font-bold">{employee.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-sm">{employee.name}</p>
          <p className="text-xs text-muted-foreground">{employee.jobTitle} — {employee.department}</p>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending || messages.length === 0}
          title="مسح المحادثة">
          <Trash2 className="h-4 w-4" />
        </Button>
        {sendMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">لا توجد رسائل بعد — ابدأ المحادثة</p>
          )}
          {messages.map((msg: ChatMsg) => (
            <MessageBubble key={msg.id} msg={msg} senderName={employee.name} />
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border space-y-2 shrink-0">
        {/* Media inputs */}
        {mediaMode === "image" && (
          <div className="flex gap-2 animate-fade-in">
            <div className="flex-1 space-y-1.5">
              <Input
                dir="ltr"
                value={mediaUrl}
                onChange={(e) => { setMediaUrl(e.target.value); setImagePreviewOk(false); }}
                placeholder="https://... رابط الصورة"
                className="text-sm"
              />
              {mediaUrl && (
                <img
                  src={mediaUrl}
                  alt="preview"
                  className="h-20 rounded-lg object-cover border border-border"
                  onLoad={() => setImagePreviewOk(true)}
                  onError={() => setImagePreviewOk(false)}
                  style={{ display: imagePreviewOk || mediaUrl ? "block" : "none" }}
                />
              )}
            </div>
          </div>
        )}
        {mediaMode === "link" && (
          <Input
            dir="ltr"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://... الرابط"
            className="text-sm animate-fade-in"
          />
        )}

        {/* Main input row */}
        <form onSubmit={handleSend} className="flex gap-2">
          <Button
            type="button"
            size="icon"
            variant={mediaMode === "image" ? "default" : "ghost"}
            className="h-10 w-10 shrink-0"
            onClick={() => toggleMode("image")}
            title="إرسال صورة"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={mediaMode === "link" ? "default" : "ghost"}
            className="h-10 w-10 shrink-0"
            onClick={() => toggleMode("link")}
            title="إرسال رابط"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mediaMode === "image" ? "وصف الصورة (اختياري)..."
              : mediaMode === "link" ? "عنوان الرابط (اختياري)..."
              : `رسالة لـ ${employee.name}...`
            }
            className="flex-1"
          />
          <Button type="submit" size="icon" className="h-10 w-10" disabled={!canSend()}>
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </Card>
  );
}

export default function Messages() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const { data: employees = [], isLoading } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });

  const filtered = employees.filter(
    (e) => e.name.includes(search) || e.department.includes(search) || e.jobTitle.includes(search)
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fade-in">
      {/* Sidebar */}
      <Card className="w-72 flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-border bg-muted/10 space-y-2">
          <p className="font-semibold flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" /> المحادثات ({employees.length})
          </p>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث عن موظف..."
            className="h-8 text-sm"
          />
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">لا يوجد نتائج</p>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`w-full text-right flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-muted ${
                    selectedEmployee?.id === emp.id ? "bg-primary/10 border border-primary/30" : ""
                  }`}
                >
                  <Avatar className="h-9 w-9 border border-primary/20 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {emp.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{emp.department}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedEmployee ? (
          <ChatPanel employee={selectedEmployee} />
        ) : (
          <Card className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-3">
              <MessageCircle className="h-14 w-14 mx-auto opacity-20" />
              <p className="font-medium">اختر موظفاً من القائمة لبدء المحادثة</p>
              <p className="text-xs">يمكنك إرسال نصوص وصور وروابط</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
