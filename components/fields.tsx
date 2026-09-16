"use client";

import type { ReactNode } from "react";

export function SectionCard({
  title,
  subtitle,
  children,
  trailing,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-stone-500">{subtitle}</p> : null}
        </div>
        {trailing}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function ResultRow({
  label,
  value,
  note,
  emphasis,
  negative,
}: {
  label: string;
  value: string;
  note?: string;
  emphasis?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div>
        <div className={emphasis ? "font-semibold" : ""}>{label}</div>
        {note ? <div className="text-xs text-stone-500">{note}</div> : null}
      </div>
      <div
        className={`tabular-nums ${emphasis ? "font-semibold" : ""} ${negative ? "text-red-600 dark:text-red-400" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

export function NoteBanner({ text }: { text: string }) {
  return (
    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
      {text}
    </p>
  );
}

export function MoneyField({
  label,
  value,
  onChange,
  helper,
  prefix = "£",
  suffix,
  decimals = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper?: string;
  prefix?: string | null;
  suffix?: string;
  decimals?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-stone-600 dark:text-stone-300">{label}</span>
      <div className="flex items-center rounded-md border border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-950">
        {prefix ? <span className="pl-3 text-stone-400">{prefix}</span> : null}
        <input
          className="w-full bg-transparent px-3 py-2 outline-none"
          inputMode="decimal"
          value={Number.isFinite(value) ? String(value) : ""}
          onChange={(event) => {
            const text = event.target.value;
            if (text === "") {
              onChange(0);
              return;
            }
            const next = Number(text);
            if (Number.isFinite(next)) onChange(decimals ? next : next);
          }}
        />
        {suffix ? <span className="pr-3 text-stone-400">{suffix}</span> : null}
      </div>
      {helper ? <span className="mt-1 block text-xs text-stone-500">{helper}</span> : null}
    </label>
  );
}

export function PercentField(props: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper?: string;
}) {
  return <MoneyField {...props} prefix={null} suffix="%" decimals />;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-sm ${
            value === option.value
              ? "bg-white font-medium shadow dark:bg-stone-950"
              : "text-stone-600 dark:text-stone-300"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  label,
  subtitle,
  checked,
  onChange,
}: {
  label: string;
  subtitle?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {subtitle ? <span className="block text-xs text-stone-500">{subtitle}</span> : null}
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
