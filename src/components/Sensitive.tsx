import React from "react";
import { useInspectContext } from "../contexts/InspectContext";

interface SensitiveProps {
  value?: any;
  children?: React.ReactNode;
  className?: string;
}

export default function Sensitive({
  value,
  children,
  className,
}: SensitiveProps) {
  const { isInspectOpen } = useInspectContext();

  if (isInspectOpen) {
    return (
      <span className={className ?? "italic text-rose-600"}>
        [Disamarkan saat inspeksi]
      </span>
    );
  }

  if (children != null) return <span className={className}>{children}</span>;

  return <span className={className}>{value ?? "-"}</span>;
}
