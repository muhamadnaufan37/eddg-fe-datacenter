import { useEffect, useMemo, useState } from "react";
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
import type {
  InputActionMeta,
  SingleValue,
  MultiValue,
  StylesConfig,
} from "react-select";
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
  helperText?: ReactNode;
  className?: string;
  required?: boolean;
}

const fieldShell =
  "w-full rounded-2xl border-2 border-[#cbdcf5] bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2373f4] focus:ring-4 focus:ring-[#2373f4]/15 dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#dde6ed] dark:placeholder:text-[#9db2bf]/70 dark:focus:border-[#65d0f4] dark:focus:ring-[#65d0f4]/20";

const fieldError = "mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400";

const fieldLabel =
  "mb-2 block text-sm font-bold text-slate-800 dark:text-[#dde6ed]";

const primeFieldClass =
  "w-full p-inputtext-sm rounded-2xl border-2 border-[#cbdcf5] bg-[#f8fafd] text-xs font-medium text-slate-900 shadow-2xs outline-none transition placeholder:text-slate-400 focus:border-[#2373f4] focus:bg-white focus:ring-4 focus:ring-[#2373f4]/15 dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#dde6ed] dark:placeholder:text-[#9db2bf]/70 dark:focus:border-[#65d0f4] dark:focus:ring-[#65d0f4]/20";

const primeFieldErrorClass =
  "border-rose-500 focus:border-rose-500 focus:ring-rose-500/15 dark:border-rose-400";

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

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileValue) {
      setPreviewUrl(null);
      return;
    }

    // Jika file baru dipilih
    if (fileValue instanceof File) {
      const objectUrl = URL.createObjectURL(fileValue);
      setPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    // Jika berasal dari URL backend
    if (typeof fileValue === "string") {
      setPreviewUrl(fileValue);
    }
  }, [fileValue]);

  const selectedName = (() => {
    if (fileValue instanceof File) {
      return fileValue.name;
    }

    if (typeof fileValue === "string") {
      return fileValue.split("/").pop() || fileValue;
    }

    return "Belum ada file";
  })();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    formik.setFieldValue(name, file);
    formik.setFieldTouched(name, true);
  };

  return (
    <div className={className}>
      <span className={fieldLabel}>
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </span>

      <label className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition-all hover:border-sky-400 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-sky-500">
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

          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {selectedName}
          </span>
        </div>

        {previewUrl && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <img
              src={previewUrl}
              alt={previewLabel}
              className="h-56 w-full object-cover transition-all duration-300 hover:scale-105"
            />
          </div>
        )}
      </label>

      {helperText && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}

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
    <div className="space-y-6 rounded-3xl border-2 border-[#cbdcf5] bg-white p-6 shadow-sm dark:border-[#526d82] dark:bg-[#27374d] sm:p-7">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-[#cbdcf5] bg-[#edf2f9] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-[#2373f4] dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#65d0f4]">
            DATA CENTER HUB
          </span>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#2373f4] dark:text-[#65d0f4]">
            Modul Operasi
          </p>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-[#dde6ed] sm:text-3xl">
          {title}
        </h1>
        <p className="max-w-3xl text-sm font-medium leading-relaxed text-slate-600 dark:text-[#9db2bf]">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isDone = index < activeStep;

          return (
            <div key={step} className="flex flex-1 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 text-sm font-extrabold transition shadow-xs ${
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isActive
                      ? "border-[#2373f4] bg-[#2373f4] text-white shadow-md shadow-[#2373f4]/25"
                      : "border-[#cbdcf5] bg-[#edf2f9] text-slate-500 dark:border-[#526d82] dark:bg-[#1c2736] dark:text-[#9db2bf]"
                }`}
              >
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-bold ${
                    isActive || isDone
                      ? "text-slate-900 dark:text-[#dde6ed]"
                      : "text-slate-500 dark:text-[#9db2bf]"
                  }`}
                >
                  {step}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDone
                        ? "bg-emerald-500"
                        : isActive
                          ? "bg-[#2373f4]"
                          : "bg-transparent"
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
  noOptionsMessage?: string;
  disabled?: boolean;
  filterOption?: any;
  onInputChange?: (
    newValue: string,
    actionMeta: InputActionMeta,
  ) => string | void;
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
  filterOption,
  placeholder = "Pilih opsi",
  noOptionsMessage = "Tidak ada opsi tersedia",
  onInputChange,
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
        .map((v) => options.find((opt) => opt.value === v) || { label: String(v), value: String(v) })
        .filter(Boolean) as ReactSelectOption[];
    }

    return options.find((opt) => opt.value === value) || (value ? { label: String(value), value: String(value) } : null);
  }, [value, options, isMulti]);

  const selectStyles = useMemo<StylesConfig<ReactSelectOption, boolean>>(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: "44px",
        borderRadius: "1rem",
        borderWidth: "2px",
        borderColor: hasError
          ? "#ef4444"
          : state.isFocused
            ? isDarkMode
              ? "#65d0f4"
              : "#2373f4"
            : isDarkMode
              ? "#526d82"
              : "#cbdcf5",
        backgroundColor: isDarkMode ? "#1c2736" : "#ffffff",
        boxShadow: state.isFocused
          ? `0 0 0 4px ${isDarkMode ? "rgba(101, 208, 244, 0.18)" : "rgba(35, 115, 244, 0.15)"}`
          : "none",
        opacity: disabled ? 0.72 : 1,
        transition: "all 150ms ease",
        "&:hover": {
          borderColor: hasError
            ? "#ef4444"
            : disabled
              ? isDarkMode
                ? "#526d82"
                : "#cbdcf5"
              : isDarkMode
                ? "#65d0f4"
                : "#2373f4",
        },
      }),
      valueContainer: (base) => ({
        ...base,
        padding: "0.125rem 0.875rem",
      }),
      singleValue: (base) => ({
        ...base,
        color: isDarkMode ? "#dde6ed" : "#0f172a",
        fontWeight: 600,
      }),
      input: (base) => ({
        ...base,
        color: isDarkMode ? "#dde6ed" : "#0f172a",
        fontWeight: 500,
      }),
      placeholder: (base) => ({
        ...base,
        color: isDarkMode ? "#9db2bf" : "#94a3b8",
        fontWeight: 400,
      }),
      indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: isDarkMode ? "#526d82" : "#cbdcf5",
      }),
      dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused ? (isDarkMode ? "#65d0f4" : "#2373f4") : isDarkMode ? "#9db2bf" : "#526d82",
        "&:hover": {
          color: isDarkMode ? "#65d0f4" : "#2373f4",
        },
      }),
      clearIndicator: (base) => ({
        ...base,
        color: isDarkMode ? "#9db2bf" : "#526d82",
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
        border: `2px solid ${isDarkMode ? "#526d82" : "#cbdcf5"}`,
        backgroundColor: isDarkMode ? "#27374d" : "#ffffff",
        boxShadow: isDarkMode
          ? "0 24px 48px rgba(10, 18, 30, 0.7)"
          : "0 24px 48px rgba(35, 115, 244, 0.12)",
      }),
      option: (base, state) => ({
        ...base,
        borderRadius: "0.75rem",
        margin: "0.125rem 0",
        backgroundColor: state.isSelected
          ? isDarkMode
            ? "#578ef5"
            : "#2373f4"
          : state.isFocused
            ? isDarkMode
              ? "#33465e"
              : "#edf2f9"
            : "transparent",
        color: state.isSelected
          ? "#ffffff"
          : isDarkMode
            ? "#dde6ed"
            : "#0f172a",
        fontWeight: state.isSelected ? 600 : 500,
        cursor: state.isDisabled ? "not-allowed" : "pointer",
        padding: "0.625rem 1rem",
        "&:active": {
          backgroundColor: isDarkMode ? "#33465e" : "#e0effe",
        },
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
      }),
      menuList: (base) => ({
        ...base,
        padding: "0.5rem",
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
        onInputChange={onInputChange}
        isMulti={isMulti}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isLoading={isLoading}
        isDisabled={disabled}
        filterOption={filterOption !== undefined ? filterOption : (onInputChange ? () => true : undefined)}
        placeholder={placeholder}
        noOptionsMessage={() => noOptionsMessage}
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
