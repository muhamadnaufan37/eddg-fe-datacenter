import { useEffect, useMemo } from "react";
import type {
  ChangeEvent,
  InputHTMLAttributes,
  FocusEvent,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { getIn } from "formik";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Password } from "primereact/password";
import Select from "react-select";
import type { SingleValue, MultiValue } from "react-select";

type FormikBag = {
  values: Record<string, unknown>;
  errors: Record<string, unknown>;
  touched: Record<string, unknown>;
  submitCount: number;
  handleChange: (
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | ChangeEvent<HTMLSelectElement>,
  ) => void;
  handleBlur: (
    event:
      | FocusEvent<HTMLInputElement>
      | FocusEvent<HTMLTextAreaElement>
      | FocusEvent<HTMLSelectElement>,
  ) => void;
  setFieldValue: (
    field: string,
    value: unknown,
    shouldValidate?: boolean,
  ) => void | Promise<unknown>;
  setFieldTouched: (
    field: string,
    isTouched?: boolean,
    shouldValidate?: boolean,
  ) => void | Promise<unknown>;
};

interface CommonFieldProps {
  label: string;
  name: string;
  formik: FormikBag;
  helperText?: string;
  className?: string;
  required?: boolean;
}

const fieldShell =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const fieldError = "mt-1 text-xs font-medium text-rose-600 dark:text-rose-400";

const fieldLabel =
  "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200";

const shouldShowError = (formik: FormikBag, name: string) => {
  return Boolean(getIn(formik.touched, name) || formik.submitCount > 0);
};

const getFieldError = (formik: FormikBag, name: string) => {
  const error = getIn(formik.errors, name);

  if (!error || !shouldShowError(formik, name)) {
    return null;
  }

  return String(error);
};

export const TextField = ({
  label,
  name,
  formik,
  helperText,
  className,
  required = false,
  ...inputProps
}: CommonFieldProps &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "name" | "value" | "onChange" | "onBlur"
  >) => {
  const error = getFieldError(formik, name);

  return (
    <label className={className}>
      <span className={fieldLabel}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <input
        {...inputProps}
        name={name}
        value={
          (getIn(formik.values, name) as string | number | undefined) ?? ""
        }
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        className={fieldShell}
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      {error ? <p className={fieldError}>{error}</p> : null}
    </label>
  );
};

export const SelectField = ({
  label,
  name,
  formik,
  helperText,
  className,
  required = false,
  children,
  ...selectProps
}: CommonFieldProps &
  Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "name" | "value" | "onChange" | "onBlur"
  > & {
    children: ReactNode;
  }) => {
  const error = getFieldError(formik, name);

  return (
    <label className={className}>
      <span className={fieldLabel}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <select
        {...selectProps}
        name={name}
        value={
          (getIn(formik.values, name) as string | number | undefined) ?? ""
        }
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        className={fieldShell}
      >
        {children}
      </select>
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      {error ? <p className={fieldError}>{error}</p> : null}
    </label>
  );
};

export const TextareaField = ({
  label,
  name,
  formik,
  helperText,
  className,
  required = false,
  rows = 4,
  ...textareaProps
}: CommonFieldProps &
  Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "name" | "value" | "onChange" | "onBlur"
  >) => {
  const error = getFieldError(formik, name);

  return (
    <label className={className}>
      <span className={fieldLabel}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <textarea
        {...textareaProps}
        name={name}
        rows={rows}
        value={(getIn(formik.values, name) as string | undefined) ?? ""}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        className={`${fieldShell} resize-none`}
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      {error ? <p className={fieldError}>{error}</p> : null}
    </label>
  );
};

interface PhotoFieldProps extends CommonFieldProps {
  accept?: string;
  previewLabel?: string;
}

export const PhotoField = ({
  label,
  name,
  formik,
  helperText,
  className,
  required = false,
  accept = "image/*",
  previewLabel = "Pratinjau foto",
}: PhotoFieldProps) => {
  const fileValue = getIn(formik.values, name) as
    | File
    | string
    | null
    | undefined;
  const error = getFieldError(formik, name);
  const previewUrl = useMemo(() => {
    if (!(fileValue instanceof File)) {
      return null;
    }

    return URL.createObjectURL(fileValue);
  }, [fileValue]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const selectedName = useMemo(() => {
    if (fileValue instanceof File) {
      return fileValue.name;
    }

    if (typeof fileValue === "string") {
      return fileValue;
    }

    return "Belum ada file";
  }, [fileValue]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    formik.setFieldValue(name, file);
    formik.setFieldTouched(name, true, false);
  };

  return (
    <div className={className}>
      <span className={fieldLabel}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>

      <label className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-sky-400 hover:bg-sky-50/60 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-sky-500 dark:hover:bg-slate-900">
        <input
          name={name}
          type="file"
          accept={accept}
          onChange={handleChange}
          onBlur={formik.handleBlur}
          className="hidden"
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Klik untuk memilih foto
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {selectedName}
          </span>
        </div>
        {previewUrl ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <img
              src={previewUrl}
              alt={previewLabel}
              className="h-48 w-full object-cover"
            />
          </div>
        ) : null}
      </label>

      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      {error ? <p className={fieldError}>{error}</p> : null}
    </div>
  );
};

interface StepperHeaderProps {
  title: string;
  description: string;
  steps: string[];
  activeStep: number;
}

export const StepperHeader = ({
  title,
  description,
  steps,
  activeStep,
}: StepperHeaderProps) => {
  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 sm:p-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">
          Data Center
        </p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isDone = index < activeStep;

          return (
            <div key={step} className="flex flex-1 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isActive
                      ? "border-sky-500 bg-sky-500 text-white"
                      : "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {index + 1}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    isActive || isDone
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {step}
                </p>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDone || isActive ? "bg-sky-500" : "bg-transparent"
                    }`}
                    style={{ width: isDone ? "100%" : isActive ? "65%" : "0%" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ===== PrimeReact Components ===== */

export const PrimeInputText = ({
  label,
  name,
  formik,
  helperText,
  className,
  required = false,
  ...inputProps
}: CommonFieldProps &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "name" | "value" | "onChange" | "onBlur"
  >) => {
  const error = getFieldError(formik, name);

  return (
    <label className={className}>
      <span className={fieldLabel}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <InputText
        {...inputProps}
        name={name}
        value={
          (getIn(formik.values, name) as string | number | undefined) ?? ""
        }
        onChange={(e) => {
          const event = {
            target: { name, value: e.target.value },
          } as unknown as ChangeEvent<HTMLInputElement>;
          formik.handleChange(event);
        }}
        onBlur={() => formik.setFieldTouched(name, true)}
        className={`w-full ${error ? "p-invalid" : ""}`}
        style={{ borderRadius: "1rem" }}
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      {error ? <p className={fieldError}>{error}</p> : null}
    </label>
  );
};

export const PrimeInputNumber = ({
  label,
  name,
  formik,
  helperText,
  className,
  required = false,
  ...numberProps
}: CommonFieldProps &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "name" | "value" | "onChange" | "onBlur"
  >) => {
  const error = getFieldError(formik, name);

  return (
    <label className={className}>
      <span className={fieldLabel}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <InputNumber
        {...numberProps}
        name={name}
        value={
          (getIn(formik.values, name) as string | number | undefined) ?? ""
        }
        onValueChange={(e) => {
          formik.setFieldValue(name, e.value ?? "");
        }}
        onBlur={() => formik.setFieldTouched(name, true)}
        className={`w-full ${error ? "p-invalid" : ""}`}
        style={{ borderRadius: "1rem" }}
        useGrouping={false}
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      {error ? <p className={fieldError}>{error}</p> : null}
    </label>
  );
};

export const PrimePassword = ({
  label,
  name,
  formik,
  helperText,
  className,
  required = false,
  ...inputProps
}: CommonFieldProps &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "name" | "value" | "onChange" | "onBlur"
  >) => {
  const error = getFieldError(formik, name);

  return (
    <label className={className}>
      <span className={fieldLabel}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <Password
        {...inputProps}
        name={name}
        value={
          (getIn(formik.values, name) as string | number | undefined) ?? ""
        }
        onChange={(e) => {
          const event = {
            target: { name, value: e.target.value },
          } as unknown as ChangeEvent<HTMLInputElement>;
          formik.handleChange(event);
        }}
        onBlur={() => formik.setFieldTouched(name, true)}
        className={`w-full ${error ? "p-invalid" : ""}`}
        inputClassName="w-full"
        style={{ borderRadius: "1rem" }}
        feedback={false}
        toggleMask
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      {error ? <p className={fieldError}>{error}</p> : null}
    </label>
  );
};

interface ReactSelectOption {
  label: string;
  value: string | number;
}

interface PrimeSelectProps extends CommonFieldProps {
  options: ReactSelectOption[];
  isMulti?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export const PrimeSelect = ({
  label,
  name,
  formik,
  helperText,
  className,
  required = false,
  options,
  isMulti = false,
  isClearable = true,
  isSearchable = true,
  isLoading = false,
  placeholder = "Pilih opsi",
}: PrimeSelectProps) => {
  const error = getFieldError(formik, name);
  const value = getIn(formik.values, name);

  const selectedOption = useMemo(() => {
    if (isMulti && Array.isArray(value)) {
      return value
        .map((v) => options.find((opt) => opt.value === v))
        .filter(Boolean) as ReactSelectOption[];
    }

    return options.find((opt) => opt.value === value) || null;
  }, [value, options, isMulti]);

  const handleChange = (
    newValue: SingleValue<ReactSelectOption> | MultiValue<ReactSelectOption>,
  ) => {
    if (isMulti && Array.isArray(newValue)) {
      formik.setFieldValue(
        name,
        newValue.map((opt) => opt.value),
      );
    } else if (!isMulti && newValue && !Array.isArray(newValue)) {
      formik.setFieldValue(name, newValue.value);
    } else {
      formik.setFieldValue(name, isMulti ? [] : null);
    }
    formik.setFieldTouched(name, true);
  };

  return (
    <label className={className}>
      <span className={fieldLabel}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <Select
        name={name}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        isMulti={isMulti}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isLoading={isLoading}
        placeholder={placeholder}
        className={`rounded-2xl ${error ? "border-rose-500" : ""}`}
        styles={{
          control: (base) => ({
            ...base,
            borderRadius: "1rem",
            borderColor: error ? "#e11d48" : "#cbd5e1",
            backgroundColor: "white",
            minHeight: "44px",
            "&:hover": {
              borderColor: error ? "#e11d48" : "#cbd5e1",
            },
            "&:focus": {
              borderColor: "#0ea5e9",
              outline: "none",
            },
          }),
          option: (base, state) => ({
            ...base,
            borderRadius: "0.5rem",
            backgroundColor: state.isSelected
              ? "#0ea5e9"
              : state.isFocused
                ? "#f1f5f9"
                : "white",
            color: state.isSelected ? "white" : "#1e293b",
            cursor: "pointer",
          }),
          menu: (base) => ({
            ...base,
            borderRadius: "1rem",
            marginTop: "0.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }),
        }}
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      {error ? <p className={fieldError}>{error}</p> : null}
    </label>
  );
};
