"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode, RefObject } from "react";

import { AuthControls } from "@/components/auth/auth-controls";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  sidebarToggleRef: RefObject<HTMLButtonElement | null>;
  center?: ReactNode;
  actions?: ReactNode;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  sidebarToggleRef,
  center,
  actions,
}: EditorNavbarProps) {
  const sidebarLabel = isSidebarOpen ? "Close sidebar" : "Open sidebar";

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border-subtle bg-surface px-2">
      <div className="flex min-w-0 flex-1 items-center">
        <Button
          ref={sidebarToggleRef}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={sidebarLabel}
          aria-expanded={isSidebarOpen}
          aria-controls="project-sidebar"
          onClick={onToggleSidebar}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="size-5" />
          ) : (
            <PanelLeftOpen className="size-5" />
          )}
        </Button>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center">
        {center}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        {actions}
        <AuthControls />
      </div>
    </header>
  );
}
