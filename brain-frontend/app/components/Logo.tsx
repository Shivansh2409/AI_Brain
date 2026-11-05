import { Brain } from "lucide-react";

export default function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const tile = size === "lg" ? "h-11 w-11 rounded-2xl" : "h-9 w-9 rounded-xl";
  const icon = size === "lg" ? 24 : 19;
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${tile} relative grid place-items-center bg-linear-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_24px_-4px_rgba(217,70,239,0.7)]`}
      >
        <div className="absolute inset-px rounded-[inherit] bg-linear-to-b from-white/25 to-transparent" />
        <Brain className="relative text-white" size={icon} strokeWidth={2.2} />
      </div>
      <span
        className={`${size === "lg" ? "text-xl" : "text-[17px]"} font-semibold tracking-tight text-white`}
      >
        AI Brain
      </span>
    </div>
  );
}
