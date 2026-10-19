export const MAX_ROOM_ID_LENGTH = 80;
export const ROOM_ID_SUFFIX_LENGTH = 6;

const ROOM_SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export const ROOM_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isRoomId(value: string): boolean {
  return value.length <= MAX_ROOM_ID_LENGTH && ROOM_ID_PATTERN.test(value);
}

export function toProjectSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createRoomSuffix(): string {
  const bytes = new Uint8Array(ROOM_ID_SUFFIX_LENGTH);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => {
    return ROOM_SUFFIX_ALPHABET[byte % ROOM_SUFFIX_ALPHABET.length] ?? "a";
  }).join("");
}

export function toRoomId(name: string, suffix: string): string {
  const slug = toProjectSlug(name);
  if (slug.length === 0 || !isRoomId(suffix)) {
    return "";
  }

  const maxSlugLength = MAX_ROOM_ID_LENGTH - suffix.length - 1;
  const trimmedSlug = slug.slice(0, maxSlugLength).replace(/-+$/g, "");
  if (trimmedSlug.length === 0) {
    return "";
  }

  const roomId = `${trimmedSlug}-${suffix}`;
  return isRoomId(roomId) ? roomId : "";
}
