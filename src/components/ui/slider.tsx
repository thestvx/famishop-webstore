"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "value" | "onValueChange" | "defaultValue"> {
  min: number;
  max: number;
  step?: number;
  defaultValue?: [number, number];
  value?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  label?: string;
  showLabels?: boolean;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      min,
      max,
      step = 1,
      defaultValue = [min, max],
      value,
      onValueChange,
      label,
      showLabels = true,
      ...props
    },
    ref
  ) => {
    const [internalValues, setInternalValues] = React.useState<[number, number]>(defaultValue);
    const values = value ?? internalValues;

    const handleValueChange = (newValues: number[]) => {
      const next: [number, number] = [newValues[0], newValues[1]];
      if (value === undefined) setInternalValues(next);
      onValueChange?.(next);
    };

    const safeMax = max > min ? max : min + 1;

    return (
      <div className="w-full relative">
        <SliderPrimitive.Root
          ref={ref}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            className
          )}
          min={min}
          max={safeMax}
          step={step}
          value={values}
          onValueChange={handleValueChange}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>

          {showLabels && (
            <div
              className="absolute -translate-x-1/2 -bottom-8 text-xs font-medium px-2 py-1 rounded z-10"
              style={{
                left: `${((values[0] - min) / (safeMax - min)) * 100}%`,
              }}
            >
              {label}
              {values[0]}
            </div>
          )}
          <SliderPrimitive.Thumb className="relative block h-4 w-4 rounded-full border border-primary/50 bg-black shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />

          {showLabels && (
            <div
              className="absolute -translate-x-1/2 -bottom-8 text-xs font-medium px-2 py-1 rounded z-10"
              style={{
                left: `${((values[1] - min) / (safeMax - min)) * 100}%`,
              }}
            >
              {label}
              {values[1]}
            </div>
          )}
          <SliderPrimitive.Thumb className="relative block h-4 w-4 rounded-full border border-primary/50 bg-black shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>
      </div>
    );
  }
);

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
