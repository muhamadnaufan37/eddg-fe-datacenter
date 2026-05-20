import { useEffect, useMemo } from "react";
import type {
  ChangeEvent,
  InputHTMLAttributes,
  FocusEvent,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { getIn, setIn, ErrorMessage, FormikProvider } from "formik";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import type { InputNumberProps } from "primereact/inputnumber";
import { Password } from "primereact/password";
import { Calendar } from "primereact/calendar";
import Select from "react-select";
import type { SingleValue, MultiValue, StylesConfig } from "react-select";
import { useTheme } from "../../contexts/ThemeContext";

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

const primeFieldClass =
  "w-full p-inputtext-sm rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

const primeFieldErrorClass =
  "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-400";

const shouldShowError = (formik: FormikBag, name: string) => {
  return Boolean(getIn(formik.touched, name) || formik.submitCount > 0);
};

const FormikErrorText = ({
  formik,
  name,
}: {
  formik: FormikBag;
  name: string;
}) => {
  if (!shouldShowError(formik, name)) {
    return null;
  }

  const errorFormik = getIn(formik.touched, name)
    ? formik
    : {
        ...formik,
        touched: setIn(formik.touched, name, true),
      };

  return (
    <FormikProvider value={errorFormik as any}>
      <ErrorMessage name={name}>
        {(errorMessage: string) => <p className={fieldError}>{errorMessage}</p>}
      </ErrorMessage>
    </FormikProvider>
  );
};

const formatLocalDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
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
        onChange={(event) => {
          formik.setFieldValue(name, event.target.value, true);
        }}
        onBlur={formik.handleBlur}
        className={fieldShell}
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      <FormikErrorText formik={formik} name={name} />
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
        onChange={(event) => {
          formik.setFieldValue(name, event.target.value, true);
        }}
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
      <FormikErrorText formik={formik} name={name} />
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
        onChange={(event) => {
          formik.setFieldValue(name, event.target.value, true);
        }}
        onBlur={formik.handleBlur}
        className={`${fieldShell} resize-none`}
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      <FormikErrorText formik={formik} name={name} />
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
    formik.setFieldValue(name, file, true);
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
      <FormikErrorText formik={formik} name={name} />
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
  type,
  ...inputProps
}: CommonFieldProps &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "name" | "value" | "onChange" | "onBlur"
  >) => {
  const hasError = Boolean(
    getIn(formik.errors, name) && shouldShowError(formik, name),
  );
  const value =
    (getIn(formik.values, name) as string | number | undefined) ?? "";
  const isDateField = type === "date";
  const inputValue = String(value);

  if (isDateField) {
    return (
      <label className={className}>
        <span className={fieldLabel}>
          {label} {required ? <span className="text-rose-500">*</span> : null}
        </span>
        <Calendar
          name={name}
          value={
            typeof value === "string" && value ? parseLocalDate(value) : null
          }
          onChange={(e) => {
            formik.setFieldValue(
              name,
              e.value && e.value instanceof Date
                ? formatLocalDate(e.value)
                : "",
              true,
            );
          }}
          dateFormat="dd/mm/yy"
          className={`w-full ${primeFieldClass} ${hasError ? "p-invalid" : ""}`}
          onBlur={() => formik.setFieldTouched(name, true)}
          inputClassName={`${primeFieldClass} ${hasError ? primeFieldErrorClass : ""}`}
          panelClassName="rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          touchUI
        />
        {helperText ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        ) : null}
        <FormikErrorText formik={formik} name={name} />
      </label>
    );
  }

  return (
    <label className={className}>
      <span className={fieldLabel}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <InputText
        {...inputProps}
        type={type}
        name={name}
        value={inputValue}
        onChange={(e) => {
          formik.setFieldValue(name, e.target.value, true);
        }}
        onBlur={() => formik.setFieldTouched(name, true)}
        className={`${primeFieldClass} ${hasError ? "p-invalid" : ""}`}
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      <FormikErrorText formik={formik} name={name} />
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
  Omit<InputNumberProps, "name" | "value" | "onValueChange" | "onBlur">) => {
  const hasError = Boolean(
    getIn(formik.errors, name) && shouldShowError(formik, name),
  );
  const rawValue = getIn(formik.values, name) as
    | string
    | number
    | null
    | undefined;
  const normalizedNumber =
    typeof rawValue === "number"
      ? rawValue
      : typeof rawValue === "string" && rawValue.trim() !== ""
        ? Number(rawValue)
        : null;
  const numberValue = Number.isNaN(normalizedNumber) ? null : normalizedNumber;

  return (
    <label className={className}>
      <span className={fieldLabel}>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <InputNumber
        {...numberProps}
        name={name}
        value={numberValue}
        onValueChange={(e) => {
          formik.setFieldValue(name, e.value ?? "", true);
        }}
        onBlur={() => formik.setFieldTouched(name, true)}
        className={`w-full ${hasError ? "p-invalid" : ""}`}
        inputClassName={`${primeFieldClass} ${hasError ? primeFieldErrorClass : ""}`}
        useGrouping={false}
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      <FormikErrorText formik={formik} name={name} />
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
  const hasError = Boolean(
    getIn(formik.errors, name) && shouldShowError(formik, name),
  );

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
          formik.setFieldValue(name, e.target.value, true);
        }}
        onBlur={() => formik.setFieldTouched(name, true)}
        className={`w-full ${hasError ? "p-invalid" : ""}`}
        inputClassName={`${primeFieldClass} ${hasError ? primeFieldErrorClass : ""}`}
        feedback={false}
        toggleMask
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      <FormikErrorText formik={formik} name={name} />
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
  disabled?: boolean;
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
  disabled = false,
  placeholder = "Pilih opsi",
}: PrimeSelectProps) => {
  const { theme } = useTheme();
  const hasError = Boolean(
    getIn(formik.errors, name) && shouldShowError(formik, name),
  );
  const value = getIn(formik.values, name);
  const isDarkMode = theme === "dark";

  const selectedOption = useMemo(() => {
    if (isMulti && Array.isArray(value)) {
      return value
        .map((v) => options.find((opt) => opt.value === v))
        .filter(Boolean) as ReactSelectOption[];
    }

    return options.find((opt) => opt.value === value) || null;
  }, [value, options, isMulti]);

  const selectStyles = useMemo<StylesConfig<ReactSelectOption, boolean>>(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: "44px",
        borderRadius: "1rem",
        borderColor: hasError
          ? "#ef4444"
          : state.isFocused
            ? "#0ea5e9"
            : isDarkMode
              ? "#334155"
              : "#cbd5e1",
        backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
        boxShadow: state.isFocused
          ? `0 0 0 4px ${isDarkMode ? "rgba(56, 189, 248, 0.15)" : "rgba(14, 165, 233, 0.12)"}`
          : "none",
        opacity: disabled ? 0.72 : 1,
        transition: "all 150ms ease",
        "&:hover": {
          borderColor: hasError
            ? "#ef4444"
            : disabled
              ? isDarkMode
                ? "#334155"
                : "#cbd5e1"
              : "#0ea5e9",
        },
      }),
      valueContainer: (base) => ({
        ...base,
        padding: "0.125rem 0.875rem",
      }),
      singleValue: (base) => ({
        ...base,
        color: isDarkMode ? "#e2e8f0" : "#0f172a",
      }),
      input: (base) => ({
        ...base,
        color: isDarkMode ? "#e2e8f0" : "#0f172a",
      }),
      placeholder: (base) => ({
        ...base,
        color: isDarkMode ? "#94a3b8" : "#64748b",
      }),
      indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: isDarkMode ? "#334155" : "#cbd5e1",
      }),
      dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused ? "#0ea5e9" : isDarkMode ? "#94a3b8" : "#64748b",
        "&:hover": {
          color: "#0ea5e9",
        },
      }),
      clearIndicator: (base) => ({
        ...base,
        color: isDarkMode ? "#94a3b8" : "#64748b",
        "&:hover": {
          color: "#ef4444",
        },
      }),
      menu: (base) => ({
        ...base,
        zIndex: 9999,
        marginTop: "0.5rem",
        overflow: "hidden",
        borderRadius: "1rem",
        border: `1px solid ${isDarkMode ? "#334155" : "#e2e8f0"}`,
        backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
        boxShadow: isDarkMode
          ? "0 24px 48px rgba(2, 6, 23, 0.55)"
          : "0 24px 48px rgba(15, 23, 42, 0.12)",
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
      }),
      menuList: (base) => ({
        ...base,
        padding: "0.5rem",
      }),
      option: (base, state) => ({
        ...base,
        borderRadius: "0.75rem",
        margin: "0.125rem 0",
        backgroundColor: state.isSelected
          ? "#0ea5e9"
          : state.isFocused
            ? isDarkMode
              ? "#1e293b"
              : "#f1f5f9"
            : isDarkMode
              ? "#0f172a"
              : "#ffffff",
        color: state.isSelected
          ? "#ffffff"
          : isDarkMode
            ? "#e2e8f0"
            : "#0f172a",
        cursor: state.isDisabled ? "not-allowed" : "pointer",
        "&:active": {
          backgroundColor: state.isSelected
            ? "#0284c7"
            : isDarkMode
              ? "#334155"
              : "#e2e8f0",
        },
      }),
      multiValue: (base) => ({
        ...base,
        borderRadius: "9999px",
        backgroundColor: isDarkMode ? "#1e293b" : "#e2e8f0",
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: isDarkMode ? "#e2e8f0" : "#0f172a",
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: isDarkMode ? "#94a3b8" : "#64748b",
        "&:hover": {
          color: "#ffffff",
          backgroundColor: "#ef4444",
          borderRadius: "9999px",
        },
      }),
      noOptionsMessage: (base) => ({
        ...base,
        color: isDarkMode ? "#94a3b8" : "#64748b",
      }),
    }),
    [disabled, hasError, isDarkMode],
  );

  const handleChange = (
    newValue: SingleValue<ReactSelectOption> | MultiValue<ReactSelectOption>,
  ) => {
    if (isMulti) {
      const multiValue = Array.isArray(newValue) ? newValue : [];
      formik.setFieldValue(
        name,
        multiValue.map((opt) => opt.value),
        true,
      );
    } else {
      const singleValue = newValue as SingleValue<ReactSelectOption>;
      formik.setFieldValue(name, singleValue?.value ?? null, true);
    }
    formik.setFieldTouched(name, true, false);
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
        isDisabled={disabled}
        placeholder={placeholder}
        className="w-full"
        styles={selectStyles}
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
      />
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
      <FormikErrorText formik={formik} name={name} />
    </label>
  );
};
