import { renderToString } from "react-dom/server";
import App from "../src/App";
import { allPages, type PageMeta } from "../src/lib/meta";

export type { PageMeta };

export function renderPage(pathname: string): string {
  return renderToString(<App initialPath={pathname} />);
}

export function pages(): PageMeta[] {
  return allPages();
}
