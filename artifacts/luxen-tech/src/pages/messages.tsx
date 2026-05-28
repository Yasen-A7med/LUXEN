import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Users, Loader2 } from "lucide-react";
import { getEmployees, getChat, sendChatMessage, type Employee, type ChatMsg } from "@/lib/api";

function ChatPanel({ employee }: { employee: Employee }) {
  const [newMessage, setNewMessage] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const empIdStr = String(employee.id);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat", empIdStr],
    queryFn: () => getChat(empIdStr),
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) => sendChatMessage(empIdStr, msg, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", empIdStr] }),
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage.trim());
    setNewMessage("");
  };

  return (
    <Card className="flex-1 flex flex-col border-border bg-card overflow-hidden h-full">
      <div className="p-4 border-b border-border bg-muted/10 flex items-center gap-3 shrink-0">
        <Avatar className="h-9 w-9 border border-primary/30">
          <AvatarFallback className="bg-primary/10 text-primary font-bold">{employee.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{employee.name}</p>
          <p className="text-xs text-muted-foreground">{employee.jobTitle} — {employee.department}</p>
        </div>
        {sendMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-auto" />}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">لا توجد رسائل بعد</p>
          )}
          {messages.map((msg: ChatMsg) => {
            const isAdmin = msg.isFromAdmin;
            return (
              <div key={msg.id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  isAdmin ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  <p className="text-[10px] font-semibold mb-1 opacity-70">{isAdmin ? "الإدارة" : employee.name}</p>
                  <p>{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2 shrink-0">
        <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
          placeholder={`رسالة لـ ${employee.name}...`} className="flex-1" />
        <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMutation.isPending}>
          {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Card>
  );
}

export default function Messages() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { data: employees = [], isLoading } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fade-in">
      {/* Sidebar */}
      <Card className="w-72 flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-border bg-muted/10">
          <p className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> المحادثات ({employees.length})
          </p>
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : employees.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">لا يوجد موظفون</p>
          ) : (
            <div className="p-2 space-y-1">
              {employees.map((emp) => (
                <button key={emp.id} onClick={() => setSelectedEmployee(emp)}
                  className={`w-full text-right flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-muted ${
                    selectedEmployee?.id === emp.id ? "bg-primary/10 border border-primary/30" : ""
                  }`}>
                  <Avatar className="h-9 w-9 border border-primary/20 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{emp.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{emp.jobTitle}</p>
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
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>اختر موظفاً من القائمة لبدء المحادثة</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
