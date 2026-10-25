export function specListPath(projectId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/specs`;
}

export function specDownloadPath(projectId: string, specId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(specId)}/download`;
}

export function triggerSpecDownload(projectId: string, specId: string, filename: string) {
  const link = document.createElement("a");
  link.href = specDownloadPath(projectId, specId);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}
