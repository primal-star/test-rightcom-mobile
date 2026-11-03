import { useRef, useState } from "react";
import { reach, ValidationError, type Schema } from "yup";
import { getRequestErrorMessage } from "@/shared/utils/getRequestErrorMessage";
import { useToast } from "./useToast";

type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function useValidatedForm<T extends Record<string, string>>(
  schema: Schema<T>,
  initialValues: T,
  options?: {
    errorMessage?: string;
  },
) {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<T>>({
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const showToast = useToast();

  function isRequired(name: keyof T) {
    const field = reach(schema, String(name), values);
    const description = field.describe({
      value: values[name],
      parent: values,
    });

    return "tests" in description
      && description.tests.some((test) => test.name === "required");
  }

  function setField(name: keyof T, value: string) {
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));
    setFieldErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
  }

  function reset() {
    setValues(initialValues);
    setFieldErrors({
    });
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
            showToast("Vérifiez les informations du formulaire puis réessayez.");
          }
        } else {
          const message = getRequestErrorMessage(cause, options?.errorMessage);

          if (message) {
            showToast(message);
          }
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
    isSubmitting,
    setField,
    reset,
    isRequired,
    handleSubmit,
  };
}

export type ValidatedForm<T extends Record<string, string>> =
  ReturnType<typeof useValidatedForm<T>>;
