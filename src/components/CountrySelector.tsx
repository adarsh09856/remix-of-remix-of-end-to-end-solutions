import { COUNTRIES, useCountry, type CountryCode } from "@/lib/country";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export function CountrySelector({ compact = false }: { compact?: boolean }) {
  const [code, setCode, ready] = useCountry();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const meta = COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

  return (
    <div className="relative" ref={ref} suppressHydrationWarning>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose country and currency"
        className={`inline-flex items-center gap-1 rounded-full border border-border bg-card hover:bg-muted transition ${
          compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        <span className="text-base leading-none">{ready ? meta.flag : "🌍"}</span>
        <span className="hidden sm:inline font-semibold">{ready ? meta.currency : "—"}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCode(c.code as CountryCode);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-muted transition ${
                c.code === code ? "bg-muted/60" : ""
              }`}
            >
              <span className="text-lg">{c.flag}</span>
              <span className="flex-1">
                <span className="block font-medium">{c.name}</span>
                <span className="block text-xs text-muted-foreground">{c.currency} · {c.symbol}</span>
              </span>
              {c.code === code && <span className="text-primary text-xs">●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
