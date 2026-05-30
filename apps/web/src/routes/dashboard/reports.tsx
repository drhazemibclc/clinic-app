// app/routes/dashboard/reports.tsx

import { Button } from "@clinic-app/ui/components/button";
import { Tabs, TabsContent } from "@clinic-app/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  DollarSign,
  Download,
  FileBarChart,
  FilePieChart,
  Printer,
} from "lucide-react";
import { useState } from "react";
import { ClinicalReport } from "@/components/reports/clinical-report";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { FinancialReport } from "@/components/reports/financial-report";
import { OperationalReport } from "@/components/reports/operational-report";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/reports")({
  component: ReportsPage,
  beforeLoad: async ({ context }) => {
    const session = context.session;
    if (session?.user?.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function ReportsPage() {
  // Fix 2.4 — use a lazy initializer so the Date objects are created once,
  // not on every render. A new Date() on every render changes the query key
  // and causes unnecessary refetches.
  const [dateRange, setDateRange] = useState(() => ({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  }));
  const [reportType, setReportType] = useState("clinical");

  const { data: clinicalData, isLoading: clinicalLoading } = useQuery(
    orpc.reports.getClinical.queryOptions({
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    }),
    { enabled: reportType === "clinical" },
  );

  const { data: financialData, isLoading: financialLoading } = useQuery(
    orpc.reports.getFinancial.queryOptions({
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    }),
    { enabled: reportType === "financial" },
  );

  const { data: operationalData, isLoading: operationalLoading } = useQuery(
    orpc.reports.getOperational.queryOptions({
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    }),
    { enabled: reportType === "operational" },
  );

  const handleExport = () => {
    // Fix 3.7 — Export is not yet implemented; button is disabled in the UI.
    // TODO: implement CSV/PDF export using the active reportType and dateRange.
    console.warn("Export not yet implemented");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Generate and export clinic reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled
            className="gap-2"
            title="Export coming soon"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
        <div className="flex gap-2">
          <Button
            variant={reportType === "clinical" ? "default" : "outline"}
            size="sm"
            onClick={() => setReportType("clinical")}
            className="gap-2"
          >
            <FileBarChart className="h-4 w-4" />
            Clinical
          </Button>
          <Button
            variant={reportType === "financial" ? "default" : "outline"}
            size="sm"
            onClick={() => setReportType("financial")}
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Financial
          </Button>
          <Button
            variant={reportType === "operational" ? "default" : "outline"}
            size="sm"
            onClick={() => setReportType("operational")}
            className="gap-2"
          >
            <FilePieChart className="h-4 w-4" />
            Operational
          </Button>
        </div>
      </div>

      <Tabs value={reportType} className="space-y-4">
        <TabsContent value="clinical">
          <ClinicalReport
            data={clinicalData}
            loading={clinicalLoading}
            dateRange={dateRange}
          />
        </TabsContent>
        <TabsContent value="financial">
          <FinancialReport
            data={financialData}
            loading={financialLoading}
            dateRange={dateRange}
          />
        </TabsContent>
        <TabsContent value="operational">
          <OperationalReport
            data={operationalData}
            loading={operationalLoading}
            dateRange={dateRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
