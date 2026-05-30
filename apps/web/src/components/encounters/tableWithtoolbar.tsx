// src/components/encounters/EncounterTableWithToolbar.tsx

import { Button } from "@clinic-app/ui/components/button";
import { Input } from "@clinic-app/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@clinic-app/ui/components/select";
import {
  CalendarIcon,
  DownloadIcon,
  FileTextIcon,
  PlusIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import type { Encounter } from "./column";
import { EncounterTable } from "./Encounter.table";

interface EncounterTableWithToolbarProps {
  data: Encounter[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: (data: Encounter[]) => void;
  onCreateClick?: () => void;
  onFilterChange?: (filters: EncounterFilters) => void;
}

export interface EncounterFilters {
  status?: string;
  type?: string;
  dateRange?: { from: Date; to: Date };
  search?: string;
}

export function EncounterTableWithToolbar({
  data,
  isLoading,
  onRefresh,
  onExport,
  onCreateClick,
  onFilterChange,
}: EncounterTableWithToolbarProps) {
  const [filters, setFilters] = useState<EncounterFilters>({});

  const handleFilterChange = (newFilters: Partial<EncounterFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(data);
    } else {
      // Default export to CSV
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `encounters-${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const convertToCSV = (data: Encounter[]) => {
    const headers = [
      "Date",
      "Patient",
      "Doctor",
      "Diagnosis",
      "Type",
      "Status",
    ];
    const rows = data.map((encounter) => [
      new Date(encounter.date).toLocaleDateString(),
      encounter.patientName || "",
      encounter.doctorName || "",
      encounter.diagnosis || "",
      encounter.type || "",
      encounter.status,
    ]);
    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Input
              placeholder="Search encounters..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="pl-8"
            />
          </div>

          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange({ status: value })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.type}
            onValueChange={(value) => handleFilterChange({ type: value })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Wellness">Wellness</SelectItem>
              <SelectItem value="Follow-up">Follow-up</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>

          <DateRangePicker
            date={filters.dateRange}
            onDateChange={(range) => handleFilterChange({ dateRange: range })}
          />
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <ReloadIcon className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
          {onCreateClick && (
            <Button size="sm" onClick={onCreateClick}>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Encounter
            </Button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <FileTextIcon className="h-4 w-4" />
            Total Encounters
          </div>
          <div className="font-bold text-2xl">{data.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            Active
          </div>
          <div className="font-bold text-2xl">
            {data.filter((e) => e.status === "ACTIVE").length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Completed
          </div>
          <div className="font-bold text-2xl">
            {data.filter((e) => e.status === "COMPLETED").length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <CalendarIcon className="h-4 w-4" />
            This Month
          </div>
          <div className="font-bold text-2xl">
            {
              data.filter((e) => {
                const now = new Date();
                const encounterDate = new Date(e.date);
                return (
                  encounterDate.getMonth() === now.getMonth() &&
                  encounterDate.getFullYear() === now.getFullYear()
                );
              }).length
            }
          </div>
        </div>
      </div>

      {/* Table */}
      <EncounterTable data={data} isLoading={isLoading} />
    </div>
  );
}
