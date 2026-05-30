// routes/contact.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 font-bold text-3xl">Contact Us</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <MapPin className="mt-1 h-5 w-5 text-teal-600" />
            <div>
              <h3 className="font-semibold">Address</h3>
              <p className="text-gray-600">
                123 Medical Center Dr, Suite 100
                <br />
                City, State 12345
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Phone className="mt-1 h-5 w-5 text-teal-600" />
            <div>
              <h3 className="font-semibold">Phone</h3>
              <p className="text-gray-600">(555) 123-4567</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Mail className="mt-1 h-5 w-5 text-teal-600" />
            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-gray-600">info@smartclinic.com</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Clock className="mt-1 h-5 w-5 text-teal-600" />
            <div>
              <h3 className="font-semibold">Hours</h3>
              <p className="text-gray-600">
                Mon-Fri: 9am - 6pm
                <br />
                Sat: 10am - 2pm
                <br />
                Sun: Closed
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-gray-100 p-6">
          <form className="space-y-4">
            <input
              className="w-full rounded border p-2"
              placeholder="Name"
              type="text"
            />
            <input
              className="w-full rounded border p-2"
              placeholder="Email"
              type="email"
            />
            <textarea
              className="w-full rounded border p-2"
              placeholder="Message"
              rows={4}
            />
            <button
              className="w-full rounded bg-teal-600 py-2 text-white hover:bg-teal-700"
              type="button"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
