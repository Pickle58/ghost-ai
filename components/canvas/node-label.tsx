"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "@/lib/utils";

const LABEL_PLACEHOLDER = "Label";

interface NodeLabelProps {
  label: string;
  color: string;
  onChange: (label: string) => void;
}

export function NodeLabel({ label, color, onChange }: NodeLabelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const placeCaretRef = useRef(false);

  useEffect(() => {
    if (!editing) {
      return;
    }

    function closeIfOutside(event: PointerEvent) {
      const frame = fieldRef.current?.parentElement;

      if (
        event.target instanceof Node &&
        frame &&
        frame.contains(event.target)
      ) {
        return;
      }

      setEditing(false);
    }

    document.addEventListener("pointerdown", closeIfOutside);

    return () => {
      document.removeEventListener("pointerdown", closeIfOutside);
    };
  }, [editing]);

  useLayoutEffect(() => {
    if (!editing) {
      return;
    }

    const field = fieldRef.current;

    if (!field) {
      return;
    }

    field.style.height = "0px";
    field.style.height = `${field.scrollHeight}px`;

    if (!placeCaretRef.current) {
      return;
    }

    placeCaretRef.current = false;
    field.focus();
    const end = field.value.length;
    field.setSelectionRange(end, end);
  }, [draft, editing]);

  function startEditing() {
    placeCaretRef.current = true;
    setDraft(label);
    setEditing(true);
  }

  function changeDraft(next: string) {
    setDraft(next);

    if (next !== label) {
      onChange(next);
    }
  }

  function closeEditing() {
    setEditing(false);
  }

  function onFieldKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setEditing(false);
  }

  function stopCanvasGesture(event: ReactPointerEvent<HTMLDivElement>) {
    if (!editing) {
      return;
    }

    event.stopPropagation();

    if (event.target !== fieldRef.current) {
      event.preventDefault();
    }
  }

  return (
    <div
      className={cn(
        "absolute inset-0 z-[1] flex items-center justify-center px-3 text-center text-sm leading-5",
        editing && "nodrag nopan nowheel",
      )}
      style={{ color }}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!editing) {
          startEditing();
        }
      }}
      onPointerDown={stopCanvasGesture}
    >
      {editing ? (
        <textarea
          ref={fieldRef}
          aria-label="Node label"
          rows={1}
          value={draft}
          placeholder={LABEL_PLACEHOLDER}
          className="nodrag nopan nowheel m-0 max-h-full w-full resize-none appearance-none overflow-hidden border-0 bg-transparent p-0 text-center font-[inherit] text-sm leading-5 text-inherit outline-none placeholder:text-current placeholder:opacity-45"
          style={{ userSelect: "text" }}
          onChange={(event) => changeDraft(event.target.value)}
          onBlur={closeEditing}
          onKeyDown={onFieldKeyDown}
        />
      ) : (
        <span
          className={cn(
            "w-full whitespace-pre-wrap break-words",
            !label && "opacity-45",
          )}
        >
          {label || LABEL_PLACEHOLDER}
        </span>
      )}
    </div>
  );
}
