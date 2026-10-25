"use client";

import { Download } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import Markdown from "react-markdown";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProjectSpecItem } from "@/hooks/use-project-specs";
import { specDownloadPath } from "@/lib/spec-api";

interface SpecPreviewDialogProps {
  projectId: string;
  spec: ProjectSpecItem | null;
  onClose: () => void;
  onDownload: () => void;
}

export function SpecPreviewDialog({
  projectId,
  spec,
  onClose,
  onDownload,
}: SpecPreviewDialogProps) {
  return (
    <Dialog
      open={spec !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="!flex max-h-[85vh] min-h-0 w-full !flex-col !gap-0 overflow-hidden rounded-3xl border border-surface-border bg-elevated !p-0 text-copy-primary ring-border-subtle sm:!max-w-2xl">
        {spec ? (
          <SpecPreviewBody
            key={spec.id}
            projectId={projectId}
            spec={spec}
            onClose={onClose}
            onDownload={onDownload}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface SpecPreviewBodyProps {
  projectId: string;
  spec: ProjectSpecItem;
  onClose: () => void;
  onDownload: () => void;
}

function SpecPreviewBody({
  projectId,
  spec,
  onClose,
  onDownload,
}: SpecPreviewBodyProps) {
  const preview = useSpecPreview(projectId, spec.id);

  return (
    <div className="flex min-h-0 max-h-[85vh] flex-1 flex-col overflow-hidden">
      <DialogHeader className="shrink-0 border-b border-border-subtle p-6 pb-4 pr-12">
        <DialogTitle className="truncate text-lg font-semibold text-copy-primary">
          {spec.filename}
        </DialogTitle>
        <DialogDescription className="text-sm text-copy-muted">
          {formatSpecCreatedAt(spec.createdAt)}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <SpecPreviewContent preview={preview} />
      </div>

      <DialogFooter className="!mx-0 !mb-0 shrink-0 rounded-b-3xl border-t border-border-subtle bg-surface/80 p-6">
        <Button
          type="button"
          variant="outline"
          className="border-border-subtle text-copy-secondary hover:bg-subtle hover:text-copy-primary"
          onClick={onClose}
        >
          Close
        </Button>
        <Button
          type="button"
          className="gap-1.5 bg-accent text-white hover:bg-accent/90"
          onClick={onDownload}
        >
          <Download className="size-3.5" />
          Download
        </Button>
      </DialogFooter>
    </div>
  );
}

type SpecPreviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: string };

function SpecPreviewContent({ preview }: { preview: SpecPreviewState }) {
  switch (preview.status) {
    case "loading":
      return <p className="text-sm text-copy-muted">Loading spec...</p>;
    case "error":
      return <p className="text-sm text-state-error">{preview.message}</p>;
    case "ready":
      return (
        <div className="spec-markdown block space-y-3 break-words whitespace-normal text-sm leading-6 text-copy-secondary">
          <Markdown components={markdownComponents}>{preview.content}</Markdown>
        </div>
      );
    default: {
      const unreachable: never = preview;
      return unreachable;
    }
  }
}

function useSpecPreview(projectId: string, specId: string): SpecPreviewState {
  const [preview, setPreview] = useState<SpecPreviewState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      try {
        const response = await fetch(specDownloadPath(projectId, specId), {
          signal,
        });

        if (!response.ok) {
          if (!signal.aborted) {
            setPreview({
              status: "error",
              message: "Could not load this spec.",
            });
          }
          return;
        }

        const markdown = await response.text();
        if (signal.aborted) {
          return;
        }

        setPreview({
          status: "ready",
          content: markdown,
        });
      } catch (caught) {
        if (isAbortError(caught) || signal.aborted) {
          return;
        }

        setPreview({
          status: "error",
          message: "Could not load this spec.",
        });
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [projectId, specId]);

  return preview;
}

const markdownComponents = {
  h1: ({ children }: MarkdownElementProps) => (
    <h1 className="mt-0 mb-0 block text-lg font-semibold text-copy-primary">
      {children}
    </h1>
  ),
  h2: ({ children }: MarkdownElementProps) => (
    <h2 className="mt-4 mb-0 block text-base font-semibold text-copy-primary first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: MarkdownElementProps) => (
    <h3 className="mt-3 mb-0 block text-sm font-semibold text-copy-primary first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }: MarkdownElementProps) => (
    <p className="mb-0 block whitespace-normal text-copy-secondary">{children}</p>
  ),
  ul: ({ children }: MarkdownElementProps) => (
    <ul className="mb-0 block list-disc space-y-1 pl-5 text-copy-secondary">
      {children}
    </ul>
  ),
  ol: ({ children }: MarkdownElementProps) => (
    <ol className="mb-0 block list-decimal space-y-1 pl-5 text-copy-secondary">
      {children}
    </ol>
  ),
  li: ({ children }: MarkdownElementProps) => (
    <li className="block whitespace-normal text-copy-secondary">{children}</li>
  ),
  strong: ({ children }: MarkdownElementProps) => (
    <strong className="font-semibold text-copy-primary">{children}</strong>
  ),
  em: ({ children }: MarkdownElementProps) => (
    <em className="italic">{children}</em>
  ),
  blockquote: ({ children }: MarkdownElementProps) => (
    <blockquote className="mb-0 block border-l-2 border-border-subtle pl-3 text-copy-muted">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: MarkdownAnchorProps) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-brand underline underline-offset-3"
    >
      {children}
    </a>
  ),
  code: ({ children }: MarkdownElementProps) => (
    <code className="rounded-md bg-subtle px-1 py-0.5 font-mono text-[0.8rem] text-copy-primary">
      {children}
    </code>
  ),
  pre: ({ children }: MarkdownElementProps) => (
    <pre className="mb-3 overflow-x-auto rounded-xl border border-border-subtle bg-base p-3 font-mono text-xs text-copy-primary last:mb-0">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-4 border-border-subtle" />,
};

interface MarkdownElementProps {
  children?: ReactNode;
}

interface MarkdownAnchorProps extends MarkdownElementProps {
  href?: string;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function formatSpecCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
