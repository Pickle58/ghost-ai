"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SpecPreviewDialog, formatSpecCreatedAt } from "@/components/editor/spec-preview-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isActiveRunStatus } from "@/hooks/use-design-run";
import {
  useProjectSpecs,
  type ProjectSpecItem,
} from "@/hooks/use-project-specs";
import { useSpecRun } from "@/hooks/use-spec-run";
import { triggerSpecDownload } from "@/lib/spec-api";
import { toSpecGenerateRequest } from "@/lib/spec-payload";
import type { AiChatMessage } from "@/types/tasks";

interface AiSidebarSpecsPanelProps {
  projectId: string;
  isActive: boolean;
  chatHistory: readonly AiChatMessage[];
}

export function AiSidebarSpecsPanel({
  projectId,
  isActive,
  chatHistory,
}: AiSidebarSpecsPanelProps) {
  const { specs, isLoading, error, reload } = useProjectSpecs(projectId, isActive);
  const [selectedSpec, setSelectedSpec] = useState<ProjectSpecItem | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const handledRunIdRef = useRef<string | null>(null);
  const {
    runId,
    run,
    error: runError,
    isRunActive,
    startSpecRun,
    resetSpecRun,
  } = useSpecRun();

  useEffect(() => {
    if (!runId || handledRunIdRef.current === runId) {
      return;
    }

    const failedWithoutRun = Boolean(runError && !run);
    const finished = Boolean(run && !isActiveRunStatus(run.status));
    if (!failedWithoutRun && !finished) {
      return;
    }

    handledRunIdRef.current = runId;
    const completed = run?.status === "COMPLETED";

    queueMicrotask(() => {
      if (completed) {
        reload();
      }
      resetSpecRun();
    });
  }, [reload, resetSpecRun, run, runError, runId]);

  const trackError = getSpecTrackError(runId, run?.status, runError?.message);

  const handleDownload = (spec: ProjectSpecItem) => {
    triggerSpecDownload(projectId, spec.id, spec.filename);
  };

  const handleGenerate = () => {
    if (isRunActive) {
      return;
    }

    setStartError(null);

    void (async () => {
      const started = await startSpecRun(
        toSpecGenerateRequest(projectId, chatHistory),
      );

      if (!started.ok) {
        setStartError(started.error);
      }
    })();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <Button
        type="button"
        className="w-full bg-accent text-white hover:bg-accent/90"
        disabled={isRunActive}
        onClick={handleGenerate}
      >
        {isRunActive ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Spec"
        )}
      </Button>
      {startError || trackError ? (
        <p className="px-1 text-sm text-state-error">{startError ?? trackError}</p>
      ) : null}

      <ScrollArea className="min-h-0 flex-1">
        {isLoading ? (
          <p className="px-1 text-sm text-copy-muted">Loading specs...</p>
        ) : error ? (
          <p className="px-1 text-sm text-state-error">{error}</p>
        ) : specs.length === 0 ? (
          <p className="px-1 text-sm text-copy-muted">
            {isRunActive ? "Generating spec..." : "No specs yet."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {specs.map((spec) => (
              <li key={spec.id}>
                <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-elevated p-2.5">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                    onClick={() => setSelectedSpec(spec)}
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-subtle text-brand">
                      <FileText className="size-3.5" />
                    </div>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-copy-primary">
                        {spec.filename}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-copy-muted">
                        {formatSpecCreatedAt(spec.createdAt)}
                      </span>
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-copy-muted hover:bg-subtle hover:text-copy-primary"
                    aria-label={`Download ${spec.filename}`}
                    onClick={() => handleDownload(spec)}
                  >
                    <Download className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      <SpecPreviewDialog
        projectId={projectId}
        spec={selectedSpec}
        onClose={() => setSelectedSpec(null)}
        onDownload={() => {
          if (selectedSpec) {
            handleDownload(selectedSpec);
          }
        }}
      />
    </div>
  );
}

function getSpecTrackError(
  runId: string | null,
  status: string | undefined,
  errorMessage: string | undefined,
): string | null {
  if (!runId) {
    return null;
  }

  if (!status) {
    return errorMessage ?? null;
  }

  if (isActiveRunStatus(status) || status === "COMPLETED") {
    return null;
  }

  return errorMessage || "Spec generation failed.";
}
