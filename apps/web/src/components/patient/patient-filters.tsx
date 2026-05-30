// src/components/patients/patient-filters.tsx
import { Button } from "@clinic-app/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@clinic-app/ui/components/dropdown-menu";
import { SlidersHorizontal } from "lucide-react";

interface PatientFiltersProps {
  filters: Record<string, unknown>;
  setFilters: (filters: Record<string, unknown>) => void;
}

const genderOptions = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
];

const statusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

export function PatientFilters({ filters, setFilters }: PatientFiltersProps) {
  const toggleFilter = (key: string, value: string) => {
    const current = (filters[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilters({ ...filters, [key]: updated.length ? updated : undefined });
  };

  const isChecked = (key: string, value: string) => {
    const current = (filters[key] as string[]) || [];
    return current.includes(value);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Gender</DropdownMenuLabel>
        {genderOptions.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={isChecked("gender", opt.value)}
            onCheckedChange={() => toggleFilter("gender", opt.value)}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {statusOptions.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={isChecked("status", opt.value)}
            onCheckedChange={() => toggleFilter("status", opt.value)}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
