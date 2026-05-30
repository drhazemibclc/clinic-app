// src/components/encounters/EncounterTable.tsx

import { DataTable } from "@clinic-app/ui/components/data-table/DataTable";
import { type Encounter, encounterColumns } from "./column";

interface EncounterTableProps {
  data: Encounter[];
  isLoading?: boolean;
}

export function EncounterTable({ data, isLoading }: EncounterTableProps) {
  const statusOptions = [
    { label: "Pending", value: "PENDING" },
    { label: "Active", value: "ACTIVE" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const typeOptions = [
    { label: "General", value: "General" },
    { label: "Wellness", value: "Wellness" },
    { label: "Follow-up", value: "Follow-up" },
    { label: "Emergency", value: "Emergency" },
    { label: "Consultation", value: "Consultation" },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading encounters...</div>
      </div>
    );
  }

  return (
    <DataTable
      columns={encounterColumns}
      data={data}
      config={{
        searchColumn: "patientName",
        searchPlaceholder: "Search patients...",
        facetedFilters: [
          { column: "status", title: "Status", options: statusOptions },
          { column: "type", title: "Type", options: typeOptions },
        ],
      }}
    />
  );
}
