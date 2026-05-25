import { Link } from "react-router-dom";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 gradient-warm" />
      <div className="relative z-10 container max-w-md mx-auto px-4 py-12">
        <Link to="/" className="font-heading text-xl font-bold text-primary mb-8 inline-block">
          DogDex
        </Link>
        <h1 className="font-heading text-3xl font-bold text-foreground">{title}</h1>
        {subtitle ? (
          <p className="text-muted-foreground mt-2 mb-8">{subtitle}</p>
        ) : (
          <div className="mb-8" />
        )}
        <div className="bg-card/90 backdrop-blur rounded-2xl border border-white/70 shadow-card p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
