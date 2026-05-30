"use client";
import { Button } from "@clinic-app/ui/components/button";
import { Calendar } from "@clinic-app/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@clinic-app/ui/components/popover";
import { cn } from "@clinic-app/ui/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { RefObject } from "react";

export const DatePicker = function DatePickerCmp({
  date,
  setDate,
  ref,
}: {
  date?: Date;
  setDate: (date?: Date) => void;
  ref?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-full justify-start text-start font-normal",
            !date && "text-muted-foreground",
          )}
          variant={"outline"}
        >
          <CalendarIcon className="me-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" ref={ref}>
        <Calendar mode="single" onSelect={setDate} selected={date} />
      </PopoverContent>
    </Popover>
  );
};
