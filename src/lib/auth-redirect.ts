export function getSafeInternalPath(value: string | null, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const baseUrl = new URL("https://linkross.local");
    const targetUrl = new URL(value, baseUrl);

    if (targetUrl.origin !== baseUrl.origin) {
      return fallback;
    }

    return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
  } catch {
    return fallback;
  }
}
