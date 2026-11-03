import { useRef, useState } from "react";
import { ValidationError, type Schema } from "yup";

type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function useValidatedForm<T extends Record<string, string>>(
  schema: Schema<T>,
  initialValues: T,
) {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<T>>({
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);

  function setField(name: keyof T, value: string) {
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));
    setFieldErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
    setError(null);
  }

  function reset() {
    setValues(initialValues);
    setFieldErrors({
    });
    setError(null);
  }

  function handleSubmit(onValid: (validatedValues: T) => Promise<void>) {
    return async () => {
      if (submitting.current) {
        return;
      }

      submitting.current = true;
      setIsSubmitting(true);
      setFieldErrors({
      });
      setError(null);

      try {
        const validatedValues = await schema.validate(values, {
          abortEarly: false,
        });

        await onValid(validatedValues);
      } catch (cause) {
        if (cause instanceof ValidationError) {
          const errors: FieldErrors<T> = {
          };
          const issues = cause.inner.length ? cause.inner : [cause];

          for (const issue of issues) {
            if (issue.path && Object.hasOwn(initialValues, issue.path)) {
              const name = issue.path as keyof T;

              errors[name] ??= issue.message;
            }
          }

          setFieldErrors(errors);

          if (!Object.keys(errors).length) {
            setError(cause.message);
          }
        } else {
          setError(
            cause instanceof Error
              ? cause.message
              : "Une erreur est survenue. Veuillez réessayer.",
          );
        }
      } finally {
        submitting.current = false;
        setIsSubmitting(false);
      }
    };
  }

  return {
    values,
    fieldErrors,
    error,
    isSubmitting,
    setField,
    reset,
    handleSubmit,
  };
}

export type ValidatedForm<T extends Record<string, string>> =
  ReturnType<typeof useValidatedForm<T>>;
