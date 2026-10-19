import { Lock } from "lucide-react";
import Link from "next/link";

export function AccessDenied() {
  return (
    <div className="flex h-dvh items-center justify-center bg-base px-6">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <Lock className="size-8 text-copy-muted" />
        <p className="text-sm text-copy-secondary">
          You don&apos;t have access to this project.
        </p>
        <Link href="/editor" className="text-sm text-brand hover:underline">
          Back to editor
        </Link>
      </div>
    </div>
  );
}
