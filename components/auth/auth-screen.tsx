import { FileText, Layers, Sparkles, Users, type LucideIcon } from "lucide-react";
import { Suspense, type ReactNode } from "react";

interface AuthFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: AuthFeature[] = [
  {
    icon: Sparkles,
    title: "AI Architecture Generation",
    description:
      "Describe your system. AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

interface AuthScreenProps {
  children: ReactNode;
}

export function AuthScreen({ children }: AuthScreenProps) {
  return (
    <main className="flex min-h-full flex-1 bg-base font-sans text-copy-primary">
      <section className="hidden w-1/2 flex-col border-r border-surface-border bg-elevated px-16 py-10 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-xl bg-brand text-primary-foreground">
            <Layers className="size-4" />
          </span>
          <span className="text-sm font-medium">Ghost AI</span>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="flex max-w-xl flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-semibold tracking-tight text-copy-primary">
                Design systems at the speed of thought.
              </h1>
              <p className="text-sm leading-relaxed text-copy-secondary">
                Describe your architecture in plain English. Ghost AI maps it
                to a shared canvas your whole team can refine in real time.
              </p>
            </div>
            <ul className="flex flex-col gap-5">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <li key={feature.title} className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-subtle text-brand">
                      <Icon className="size-4" />
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-copy-primary">
                        {feature.title}
                      </span>
                      <span className="text-sm leading-relaxed text-copy-muted">
                        {feature.description}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <p className="text-xs text-copy-faint">
          © 2026 Ghost AI. All rights reserved.
        </p>
      </section>
      <section className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        <Suspense fallback={null}>{children}</Suspense>
      </section>
    </main>
  );
}
