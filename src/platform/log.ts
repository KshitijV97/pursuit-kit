/**
 * Structured JSON logs with a request ID. Posting text, evidence and tokens stay out of logs,
 * so any field whose name looks like a secret is replaced before it is written.
 */
type LogFields = Record<string, unknown>;

export type Logger = {
  info: (event: string, fields?: LogFields) => void;
  warn: (event: string, fields?: LogFields) => void;
  error: (event: string, fields?: LogFields) => void;
};

const SENSITIVE_KEY = /(token|secret|key|password|cookie|authorization|evidence|posting|resume)/i;

function redactLogFields(fields: LogFields | undefined): LogFields {
  if (!fields) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[redacted]" : value,
    ]),
  );
}

export function createLogger(
  requestId: string,
  sink: (line: string) => void = console.log,
): Logger {
  function write(level: "info" | "warn" | "error", event: string, fields?: LogFields): void {
    sink(
      JSON.stringify({
        level,
        event,
        requestId,
        time: new Date().toISOString(),
        ...redactLogFields(fields),
      }),
    );
  }

  return {
    info: (event, fields) => write("info", event, fields),
    warn: (event, fields) => write("warn", event, fields),
    error: (event, fields) => write("error", event, fields),
  };
}
