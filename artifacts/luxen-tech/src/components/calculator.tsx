import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

type Op = "+" | "-" | "×" | "÷" | null;

export function CalculatorDialog({ open, onOpenChange }: Props) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [waiting, setWaiting] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const input = (digit: string) => {
    if (waiting) {
      setDisplay(digit === "." ? "0." : digit);
      setWaiting(false);
    } else {
      if (digit === "." && display.includes(".")) return;
      setDisplay(display === "0" && digit !== "." ? digit : display + digit);
    }
  };

  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); setWaiting(false); };
  const backspace = () => { setDisplay(display.length > 1 ? display.slice(0, -1) : "0"); };
  const percent = () => { setDisplay(String(parseFloat(display) / 100)); };
  const negate = () => { setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display); };

  const handleOp = (o: Op) => {
    const cur = parseFloat(display);
    if (prev !== null && op && !waiting) {
      const res = calc(prev, cur, op);
      setDisplay(fmt(res));
      setPrev(res);
    } else {
      setPrev(cur);
    }
    setOp(o);
    setWaiting(true);
  };

  const calc = (a: number, b: number, o: Op): number => {
    if (o === "+") return a + b;
    if (o === "-") return a - b;
    if (o === "×") return a * b;
    if (o === "÷") return b === 0 ? 0 : a / b;
    return b;
  };

  const fmt = (n: number) => {
    if (isNaN(n) || !isFinite(n)) return "خطأ";
    const s = parseFloat(n.toFixed(10)).toString();
    return s.length > 12 ? parseFloat(n.toPrecision(8)).toString() : s;
  };

  const equals = () => {
    if (prev === null || op === null) return;
    const cur = parseFloat(display);
    const res = calc(prev, cur, op);
    const expr = `${fmt(prev)} ${op} ${fmt(cur)} = ${fmt(res)}`;
    setHistory((h) => [expr, ...h].slice(0, 6));
    setDisplay(fmt(res));
    setPrev(null);
    setOp(null);
    setWaiting(false);
  };

  const btn = (
    label: string | React.ReactNode,
    onClick: () => void,
    variant: "num" | "op" | "eq" | "fn" = "num",
    wide = false,
  ) => {
    const base = "h-12 text-base font-semibold rounded-xl transition-all active:scale-95 select-none";
    const cls = {
      num: "bg-card border border-border hover:bg-muted/60 text-foreground",
      op: "bg-primary/15 border border-primary/30 hover:bg-primary/25 text-primary",
      eq: "bg-primary hover:bg-primary/90 text-primary-foreground",
      fn: "bg-muted/60 border border-border hover:bg-muted text-muted-foreground",
    }[variant];
    return (
      <button key={String(label)} onClick={onClick}
        className={`${base} ${cls} ${wide ? "col-span-2" : ""}`}>
        {label}
      </button>
    );
  };

  const activeOp = op;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-4 animate-scale-in" dir="ltr">
        <DialogHeader>
          <DialogTitle className="text-right text-sm font-semibold" dir="rtl">الحاسبة</DialogTitle>
        </DialogHeader>

        {/* Display */}
        <div className="bg-muted/40 border border-border rounded-xl p-4 mb-3">
          {op && prev !== null && (
            <p className="text-xs text-muted-foreground text-right mb-1 h-4">
              {fmt(prev)} {activeOp}
            </p>
          )}
          <p className="text-3xl font-bold text-right truncate">{display}</p>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mb-3 space-y-0.5 max-h-20 overflow-y-auto">
            {history.map((h, i) => (
              <p key={i} className="text-[11px] text-muted-foreground text-right font-mono">{h}</p>
            ))}
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2">
          {btn("C", clear, "fn")}
          {btn("±", negate, "fn")}
          {btn("%", percent, "fn")}
          {btn("÷", () => handleOp("÷"), "op")}

          {btn("7", () => input("7"))}
          {btn("8", () => input("8"))}
          {btn("9", () => input("9"))}
          {btn("×", () => handleOp("×"), "op")}

          {btn("4", () => input("4"))}
          {btn("5", () => input("5"))}
          {btn("6", () => input("6"))}
          {btn("−", () => handleOp("-"), "op")}

          {btn("1", () => input("1"))}
          {btn("2", () => input("2"))}
          {btn("3", () => input("3"))}
          {btn("+", () => handleOp("+"), "op")}

          {btn("0", () => input("0"), "num", true)}
          {btn(".", () => input("."), "num")}
          {btn("=", equals, "eq")}
        </div>

        <button onClick={backspace}
          className="w-full mt-2 h-9 text-sm rounded-lg bg-muted/40 border border-border hover:bg-muted flex items-center justify-center gap-2 text-muted-foreground transition-all">
          <Delete className="h-4 w-4" /> مسح آخر رقم
        </button>
      </DialogContent>
    </Dialog>
  );
}
