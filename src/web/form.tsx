export type FormError = {
  /** The id of the input the error belongs to, used for the in-page link and aria-describedby. */
  field: string;
  message: string;
};

/**
 * The shared form-error pattern: a summary at the top of the page that links to each field,
 * with the message repeated next to the field and tied to it with aria-describedby.
 * Errors are always text, never colour alone.
 */
export function ErrorSummary(props: { errors: readonly FormError[]; heading?: string }) {
  if (props.errors.length === 0) {
    return null;
  }

  return (
    <div class="error-summary" role="alert" tabindex={-1}>
      <h2>{props.heading ?? "There is a problem"}</h2>
      <ul>
        {props.errors.map((error) => (
          <li>
            <a href={`#${error.field}`}>{error.message}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The message shown next to a field, with the id the input points at through aria-describedby. */
export function FieldError(props: { field: string; message: string }) {
  return (
    <p class="field-error" id={`${props.field}-error`}>
      {props.message}
    </p>
  );
}
