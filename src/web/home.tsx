import type { Child } from "hono/jsx";
import { Layout } from "./layout.tsx";

export type HomeProps = {
  version: string;
};

export function HomePage(props: HomeProps) {
  const steps: Child[] = [
    "Sign in with the Google account on the allowlist. Pursuit Kit keeps your files in your own Drive.",
    "Import your resume or LinkedIn export, then review every claim it extracts.",
    "Paste a job posting to get a match, a short interview, and a tailored resume and cover letter.",
  ];

  return (
    <Layout title="Pursuit Kit" active="Applications" version={props.version}>
      <h1>Pursuit Kit</h1>
      <p>
        Pursuit Kit turns one job posting into a tailored resume and cover letter, with every claim
        traced to evidence you recorded, and keeps track of each application.
      </p>
      <p>
        The foundation is in place. Sign-in, the application tracker and document generation arrive
        in the next units of the MVP plan.
      </p>
      <h2>How it will work</h2>
      <ol>
        {steps.map((step) => (
          <li>{step}</li>
        ))}
      </ol>
    </Layout>
  );
}
