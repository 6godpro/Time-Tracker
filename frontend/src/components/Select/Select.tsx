import { forwardRef } from "react";
import * as RadixSelect from "@radix-ui/react-select";

interface SelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly string[];
  placeholder?: string;
  hasError?: boolean;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      id,
      name,
      value,
      onChange,
      onBlur,
      options,
      placeholder = "Select…",
      hasError,
    },
    ref,
  ) => {
    return (
      <RadixSelect.Root
        name={name}
        value={value || undefined}
        onValueChange={onChange}
      >
        <RadixSelect.Trigger
          ref={ref}
          id={id}
          onBlur={onBlur}
          className={`flex w-full items-center justify-between rounded-xl border bg-surface px-4 py-2.5 text-left text-sm outline-none transition-colors focus:ring-2 focus:ring-brand/20 data-placeholder:text-ink-soft ${
            hasError ? "border-danger-border" : "border-line focus:border-brand"
          } text-ink`}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon asChild>
            <svg
              className="h-4 w-4 shrink-0 text-ink-soft transition-transform data-[state=open]:rotate-180"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={6}
            className="z-50 max-h-60 w-(--radix-select-trigger-width) overflow-hidden rounded-xl border border-line bg-card shadow-[0_4px_12px_-2px_rgba(16,24,40,0.12)]"
          >
            <RadixSelect.ScrollUpButton className="flex items-center justify-center py-1 text-ink-soft">
              ▲
            </RadixSelect.ScrollUpButton>
            <RadixSelect.Viewport className="p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option}
                  value={option}
                  className="cursor-pointer select-none rounded-lg px-3 py-2 text-sm text-ink outline-none data-highlighted:bg-surface data-[state=checked]:bg-status-idle-bg data-[state=checked]:font-medium"
                >
                  <RadixSelect.ItemText>{option}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
            <RadixSelect.ScrollDownButton className="flex items-center justify-center py-1 text-ink-soft">
              ▼
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    );
  },
);

Select.displayName = "Select";
