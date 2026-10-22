"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "@/lib/utils";

const LABEL_HINT = "Label";

interface EdgeLabelProps {
  x: number;
  y: number;
  label: string;
  active: boolean;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onChange: (label: string) => void;
}

export function EdgeLabel({
  x,
  y,
  label,
  active,
  editing,
  onEditingChange,
  onChange,
}: EdgeLabelProps) {
  const [draft, setDraft] = useState(label);
  const [prevEditing, setPrevEditing] = useState(editing);
  const fieldRef = useRef<HTMLInputElement>(null);

  if (editing !== prevEditing) {
    setPrevEditing(editing);
    if (editing) {
      setDraft(label);
    }
  }

  useLayoutEffect(() => {
    if (!editing) {
      return;
    }

    const field = fieldRef.current;

    if (!field) {
      return;
    }

    field.focus();
    const end = field.value.length;
    field.setSelectionRange(end, end);
  }, [editing]);

  const showHint = active && !label && !editing;
  const showBadge = Boolean(label) && !editing;

  if (!editing && !showBadge && !showHint) {
    return null;
  }

  function startEditing() {
    setDraft(label);
    onEditingChange(true);
  }

  function saveAndClose() {
    if (draft !== label) {
      onChange(draft);
    }

    onEditingChange(false);
  }

  function onFieldKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    saveAndClose();
  }

  function stopCanvasGesture(event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <div
      className="nodrag nopan nowheel absolute"
      style={{
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        pointerEvents: "all",
      }}
      onPointerDown={stopCanvasGesture}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!editing) {
          startEditing();
        }
      }}
    >
      {editing ? (
        <label className="inline-grid max-w-[240px] items-center">
          <span
            aria-hidden
            className="invisible col-start-1 row-start-1 whitespace-pre rounded-full px-2 py-0.5 text-xs leading-4"
          >
            {draft || LABEL_HINT}
          </span>
          <input
            ref={fieldRef}
            aria-label="Edge label"
            value={draft}
            placeholder={LABEL_HINT}
            className="nodrag nopan nowheel col-start-1 row-start-1 m-0 min-w-[2ch] rounded-full border border-surface-border bg-elevated px-2 py-0.5 text-xs leading-4 text-copy-primary outline-none placeholder:text-copy-faint"
            onChange={(event) => setDraft(event.target.value)}
            onBlur={saveAndClose}
            onKeyDown={onFieldKeyDown}
          />
        </label>
      ) : (
        <span
          className={cn(
            "inline-block max-w-[240px] truncate rounded-full border px-2 py-0.5 text-xs leading-4",
            showHint
              ? "border-transparent bg-elevated/80 text-copy-faint"
              : "border-surface-border bg-elevated text-copy-primary",
          )}
        >
          {label || LABEL_HINT}
        </span>
      )}
    </div>
  );
}
