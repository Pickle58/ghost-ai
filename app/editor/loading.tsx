"use client";

import { EditorHome } from "@/components/editor/editor-home";
import { EditorShell } from "@/components/editor/editor-shell";

export default function EditorLoading() {
  return (
    <EditorShell
      ownedProjects={[]}
      sharedProjects={[]}
      onCreateProject={() => {}}
      onRenameProject={() => {}}
      onDeleteProject={() => {}}
    >
      <EditorHome onCreateProject={() => {}} />
    </EditorShell>
  );
}
