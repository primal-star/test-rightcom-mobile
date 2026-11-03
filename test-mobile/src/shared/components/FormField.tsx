import type { ValidatedForm } from "@/shared/hooks/useValidatedForm";
import { TextField, type TextFieldProps } from "./TextField";

type FormFieldProps<T extends Record<string, string>> =
  Omit<TextFieldProps, "value" | "defaultValue" | "onChangeText" | "error"> & {
    name: keyof T & string;
    form: ValidatedForm<T>;
  };

export function FormField<T extends Record<string, string>>({
  name,
  form,
  editable = true,
  ...props
}: FormFieldProps<T>) {
  return (
    <TextField
      {...props}
      value={form.values[name]}
      onChangeText={(value) => form.setField(name, value)}
      error={form.fieldErrors[name]}
      editable={editable && !form.isSubmitting}
    />
  );
}
