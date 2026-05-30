// app/routes/dashboard/billing.tsx

import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { DataTable } from "@clinic-app/ui/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@clinic-app/ui/components/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { CreditCard, Plus, TrendingUp } from "lucide-react";
import { columns } from "@/components/billing/columns";
import { PaymentForm } from "@/components/billing/PaymentForm";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/billing")({
  component: BillingPage,
  beforeLoad: async ({ context }) => {
    const session = context.session;
    if (session?.user?.role !== "admin" && session?.user?.role !== "staff") {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function BillingPage() {
  const queryClient = useQueryClient();
  const { data: billing, isLoading } = useQuery(
    orpc.billing.getSummary.queryOptions(),
  );

  const _createInvoice = useMutation(
    orpc.billing.createInvoice.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["billing"] });
      },
    }),
  );

  const recordPayment = useMutation(
    orpc.billing.recordPayment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["billing"] });
      },
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Billing & Insurance
          </h1>
          <p className="text-muted-foreground">
            Manage invoices, payments, and claims
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <PaymentForm onSubmit={recordPayment.mutate} />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              {/* TODO: Replace with InvoiceForm component */}
              <div className="p-4 text-muted-foreground text-sm">
                Invoice form coming soon
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${billing?.monthlyRevenue?.toLocaleString() || 0}
            </div>
            <p className="flex items-center gap-1 text-green-600 text-xs">
              <TrendingUp className="h-3 w-3" />+{billing?.revenueGrowth || 0}%
              from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-yellow-600">
              ${billing?.outstanding || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">
              Insurance Claims
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {billing?.pendingClaims || 0}
            </div>
            <p className="text-muted-foreground text-xs">Pending processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">
              Collection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {billing?.collectionRate || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={billing?.transactions || []}
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
