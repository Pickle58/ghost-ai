export function specBlobPath(projectId: string, specId: string): string {
  return `specs/${projectId}/${specId}.md`;
}

export function specDownloadFilename(specId: string): string {
  return `spec-${specId}.md`;
}
