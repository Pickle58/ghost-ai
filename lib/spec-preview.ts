export type SpecPreviewMediaKind = "link" | "image";

export function filterPreviewHref(
  kind: SpecPreviewMediaKind,
  href: string | undefined,
): string | null {
  switch (kind) {
    case "image":
      return null;
    case "link":
      return safeHttpHref(href);
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

function safeHttpHref(href: string | undefined): string | null {
  if (href === undefined) {
    return null;
  }

  const trimmed = href.trim();
  if (trimmed.length === 0) {
    return null;
  }

  try {
    const protocol = new URL(trimmed).protocol;
    if (protocol === "http:" || protocol === "https:") {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}
