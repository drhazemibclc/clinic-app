// components/table/patients-table.tsx

import type { DbPatient as Patient } from "@clinic-app/db/schema/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@clinic-app/ui/components/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@clinic-app/ui/components/avatar";
import { Badge } from "@clinic-app/ui/components/badge";
import { Button } from "@clinic-app/ui/components/button";
import { getAgeString, getInitials } from "@clinic-app/utils";
import {
  compareItems,
  type RankingInfo,
  rankItem,
} from "@tanstack/match-sorter-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingFn,
  sortingFns,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { EyeIcon, PencilIcon, PlusIcon, Trash2 } from "lucide-react";
import React, { useCallback } from "react";
import { toast } from "sonner";
import { orpc } from "../../utils/orpc";

// Define a custom fuzzy filter function
const fuzzyFilter: FilterFn<Patient> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

// Define a custom fuzzy sort function
const fuzzySort: SortingFn<Patient> = (rowA, rowB, columnId) => {
  let dir = 0;
  const metaA = rowA.columnFiltersMeta[columnId] as
    | { itemRank?: RankingInfo }
    | undefined;
  const metaB = rowB.columnFiltersMeta[columnId] as
    | { itemRank?: RankingInfo }
    | undefined;
  if (metaA && metaB) {
    const itemRankA = metaA.itemRank;
    const itemRankB = metaB.itemRank;
    if (itemRankA && itemRankB) {
      dir = compareItems(itemRankA, itemRankB);
    }
  }
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

type PatientsTableProps = {
  clinicId: string;
  onEdit?: (patient: Patient) => void;
};

function getStatusBadge(status: string | null | undefined, isActive: boolean) {
  const variant = isActive ? "default" : "secondary";
  return (
    <Badge className="capitalize" variant={variant}>
      {status?.toLowerCase() ?? (isActive ? "active" : "inactive")}
    </Badge>
  );
}

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);
    return () => clearTimeout(timeout);
  }, [value, onChange, debounce]);

  return (
    <input
      {...props}
      onChange={(e) => setValue(e.target.value)}
      value={value}
    />
  );
}

export function PatientsTable({ onEdit }: PatientsTableProps) {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const rerender = React.useReducer(() => {
    return {};
  }, {})[1];

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Fetch patients using oRPC
  const { data, isLoading } = useQuery({
    queryKey: orpc.patient.list.key({ input: { page: 1, limit: 1000 } }),
    queryFn: () => orpc.patient.list.call({ page: 1, limit: 1000 }),
  });

  const deletePatientMutation = useMutation({
    mutationFn: (input: { id: string }) => orpc.patient.delete.call(input),
    onSuccess: () => {
      toast.success("Patient deleted successfully");
      void queryClient.invalidateQueries({
        queryKey: orpc.patient.list.key({}),
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to delete patient");
    },
  });

  const handleEdit = useCallback(
    (patient: Patient) => {
      // Use navigate instead of window.location.href
      return void navigate({
        to: "/dashboard/patients/$id/edit",
        params: { id: patient.id ?? "" },
        search: { returnTo: "/dashboard/patients" },
      });
    },
    [navigate],
  );

  const columns = React.useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        id: "fullName",
        header: "Patient Name",
        cell: ({ row }) => {
          const patient = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {patient.image ? (
                  <AvatarImage alt={patient.firstName} src={patient.image} />
                ) : null}
                <AvatarFallback>
                  {getInitials(patient.firstName, patient.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {patient.firstName} {patient.lastName}
                </div>
                <div className="text-muted-foreground text-sm">
                  {patient.email ?? patient.phone ?? "No contact"}
                </div>
              </div>
            </div>
          );
        },
        filterFn: fuzzyFilter,
        sortingFn: fuzzySort,
      },
      {
        accessorKey: "dateOfBirth",
        header: "Date of Birth",
        cell: ({ row }) =>
          row.original.dateOfBirth
            ? format(new Date(row.original.dateOfBirth), "PPP")
            : "—",
        sortingFn: "datetime",
      },
      {
        id: "age",
        header: "Age",
        cell: ({ row }) => getAgeString(row.original.dateOfBirth),
      },
      {
        accessorKey: "gender",
        header: "Gender",
        cell: ({ row }) =>
          row.original.gender?.toLowerCase() ?? "not specified",
      },
      {
        accessorKey: "bloodGroup",
        header: "Blood Type",
        cell: ({ row }) => row.original.bloodGroup ?? "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) =>
          getStatusBadge(row.original.status, row.original.status === "ACTIVE"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const patient = row.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                params={{ id: patient.id }}
                search={(prev) => prev}
                to="/dashboard/patients/$id"
              >
                <Button aria-label="View patient" size="sm" variant="ghost">
                  <EyeIcon className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                aria-label="Edit patient"
                onClick={() => onEdit?.(patient) ?? handleEdit(patient)}
                size="sm"
                variant="ghost"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button aria-label="Delete patient" size="sm" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {patient.firstName}{" "}
                      {patient.lastName}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground"
                      onClick={() =>
                        deletePatientMutation.mutate({ id: patient.id })
                      }
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      },
    ],
    [deletePatientMutation, handleEdit, onEdit],
  );

  const patients = (data?.patients ?? []) as Patient[];

  const table = useReactTable<Patient>({
    data: patients,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
  });

  // Apply fuzzy sort when the fullName column is being filtered
  React.useEffect(() => {
    const state = table.getState();
    const currentFilters = state.columnFilters;
    const currentSorting = state.sorting;
    if (
      currentFilters[0]?.id === "fullName" &&
      currentSorting[0]?.id !== "fullName"
    ) {
      table.setSorting([{ id: "fullName", desc: false }]);
    }
  }, [table]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading patients...</div>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <DebouncedInput
          className="max-w-sm flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          onChange={(value) => setGlobalFilter(String(value))}
          placeholder="Search all columns..."
          value={globalFilter ?? ""}
        />
        <Button asChild>
          <Link to="/dashboard/patients/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Patient
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      className="px-4 py-3 text-left font-medium"
                      colSpan={header.colSpan}
                      key={header.id}
                    >
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer select-none hover:text-blue-400 transition-colors"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{
                              asc: " 🔼",
                              desc: " 🔽",
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                          {header.column.getCanFilter() && (
                            <div className="mt-2">
                              <Filter column={header.column} />
                            </div>
                          )}
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {table.getRowModel().rows.map((row) => (
                <tr
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  key={row.id}
                  onClick={() => {
                    void navigate({
                      to: "/dashboard/patients/$id",
                      params: { id: row.original.id },
                    });
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td className="px-4 py-3" key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td className="h-24 text-center" colSpan={columns.length}>
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-muted-foreground text-sm">
          Showing {table.getRowModel().rows.length} of{" "}
          {table.getPrePaginationRowModel().rows.length} patients
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
            size="sm"
            variant="outline"
          >
            {"<<"}
          </Button>
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="sm"
            variant="outline"
          >
            {"<"}
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="sm"
            variant="outline"
          >
            {">"}
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            size="sm"
            variant="outline"
          >
            {">>"}
          </Button>
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            value={table.getState().pagination.pageSize}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => rerender()} size="sm" variant="outline">
          Force Rerender
        </Button>
      </div>

      <pre className="mt-4 overflow-auto rounded-md bg-muted p-4 text-xs">
        {JSON.stringify(
          {
            columnFilters: table.getState().columnFilters,
            globalFilter: table.getState().globalFilter,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}
function Filter({ column }: { column: Column<Patient, unknown> }) {
  const columnFilterValue = column.getFilterValue();

  return (
    <DebouncedInput
      className="w-full rounded-md border border-gray-600 bg-gray-700 px-2 py-1 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
      onChange={(value) => column.setFilterValue(value)}
      placeholder={"Search..."}
      type="text"
      value={(columnFilterValue ?? "") as string}
    />
  );
}
