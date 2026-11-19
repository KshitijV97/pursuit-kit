import type { Child } from "hono/jsx";
import styles from "./styles.css";

const NAV_ITEMS = [
  { href: "/", label: "Applications" },
  { href: "/applications/new", label: "New application" },
  { href: "/profile", label: "Profile" },
] as const;

type NavLabel = (typeof NAV_ITEMS)[number]["label"];

export type LayoutProps = {
  title: string;
  /** The navigation item to mark as the current page, if any. */
  active?: NavLabel;
  version: string;
  children: Child;
};

export function Layout(props: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title} - Pursuit Kit</title>
        <style>{styles}</style>
      </head>
      <body>
        <a class="skip-link" href="#main">
          Skip to main content
        </a>
        <header class="site-header">
          <nav aria-label="Primary">
            <span class="brand">Pursuit Kit</span>
            {NAV_ITEMS.map((item) => (
              <a href={item.href} aria-current={props.active === item.label ? "page" : undefined}>
                {item.label}
              </a>
            ))}
          </nav>
        </header>
        <main id="main" tabindex={-1}>
          {props.children}
        </main>
        <footer class="site-footer">
          <p>Pursuit Kit, a local-first job application workspace</p>
          <p class="version">Version {props.version}</p>
        </footer>
      </body>
    </html>
  );
}
