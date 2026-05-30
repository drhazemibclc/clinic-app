// routes/support.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/support")({
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 font-bold text-3xl">Support</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-3 font-semibold text-xl">FAQs</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium">How do I schedule an appointment?</p>
              <p className="text-gray-600 text-sm">
                Use the appointment scheduler in the dashboard...
              </p>
            </div>
            <div>
              <p className="font-medium">How to update patient records?</p>
              <p className="text-gray-600 text-sm">
                Navigate to Patients → Select patient → Edit...
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-3 font-semibold text-xl">Contact Support</h2>
          <p className="mb-4 text-gray-600">
            Our support team is available Monday-Friday, 9am-6pm
          </p>
          <p className="font-medium">Email: support@smartclinic.com</p>
          <p className="font-medium">Phone: (555) 123-4567</p>
        </div>
      </div>
    </div>
  );
}
