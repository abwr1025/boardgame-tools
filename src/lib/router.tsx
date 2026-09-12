import { useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from "react";

/** 读取当前路径。SSR 时由 initialPath 传入，浏览器里读 location。 */
export function usePathname(initialPath?: string): string {
  const [path, setPath] = useState<string>(() => {
    if (initialPath !== undefined) return initialPath;
    return typeof window === "undefined" ? "/" : window.location.pathname;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return path;
}

export function navigate(to: string): void {
  if (typeof window === "undefined") return;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));

  const hashIndex = to.indexOf("#");
  if (hashIndex >= 0) {
    const hash = to.slice(hashIndex);
    requestAnimationFrame(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  } else {
    window.scrollTo(0, 0);
  }
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  children: ReactNode;
}

/** 站内链接：保留 href 以便爬虫和右键新标签页，正常点击时走前端路由。 */
export function Link({ to, children, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
