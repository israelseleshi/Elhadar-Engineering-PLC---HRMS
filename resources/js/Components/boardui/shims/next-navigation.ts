import { router, usePage } from "@inertiajs/react";

export function usePathname(): string {
  try {
    const page = usePage();
    return page.url || (typeof window !== "undefined" ? window.location.pathname : "/");
  } catch {
    return typeof window !== "undefined" ? window.location.pathname : "/";
  }
}

export function useRouter() {
  return {
    push: (url: string) => router.visit(url),
    replace: (url: string) => router.visit(url, { replace: true }),
    back: () => (typeof window !== "undefined" ? window.history.back() : undefined),
    forward: () => (typeof window !== "undefined" ? window.history.forward() : undefined),
    refresh: () => router.reload(),
    prefetch: (_url: string) => {},
  };
}

export function useSearchParams(): URLSearchParams {
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams();
}

export function useParams(): Record<string, string | string[]> {
  return {};
}

export function redirect(url: string) {
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}
