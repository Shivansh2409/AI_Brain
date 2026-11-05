import Link from "next/link";
import Logo from "./Logo";

// Shared frame for the login / sign-up pages: dotted grid, horizon glow, glass card.
export default function AuthShell({
  title,
  subtitle,
  error,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  error?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_40%,black_20%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="horizon pointer-events-none absolute top-[68%] left-1/2 h-[2400px] w-[2400px] -translate-x-1/2"
      />
      <div
        aria-hidden
        className="aurora pointer-events-none absolute top-[45%] left-1/2 h-64 w-[720px] -translate-x-1/2 opacity-60"
      />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo size="lg" />
        </Link>

        <div className="glass rounded-3xl bg-[#0b0b10]/70 p-7 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <div className="mt-6">{children}</div>
        </div>

        <div className="mt-6 text-center text-sm text-zinc-400">{footer}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  ...input
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-zinc-300">{label}</span>
      <input
        {...input}
        className="w-full rounded-xl border border-white/8 bg-black/40 px-3.5 py-2.5 text-[15px] text-zinc-100 transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
      />
    </label>
  );
}

export function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[15px] font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
      )}
      {children}
    </button>
  );
}
