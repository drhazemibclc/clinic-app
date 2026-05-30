// src/routes/terms.tsx
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  Clock,
  CreditCard,
  FileText,
  Mail,
  Scale,
  Shield,
  UserCheck,
} from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  const effectiveDate = "January 15, 2024";

  const termsSections = [
    {
      icon: FileText,
      title: "Acceptance of Terms",
      content:
        "By accessing or using Smart Clinic Pediatric Care's services, website, or patient portal, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.",
    },
    {
      icon: UserCheck,
      title: "Patient Eligibility",
      content:
        "Our services are available for pediatric patients from birth through age 18. Parents or legal guardians must provide consent for all medical treatments and services. Patients 12 and older may have additional consent requirements as per state laws.",
    },
    {
      icon: Clock,
      title: "Appointment Policies",
      content: [
        "Please arrive 15 minutes before scheduled appointments",
        "24-hour notice required for cancellations",
        "Late arrivals may result in rescheduling",
        "No-show fees may apply for missed appointments",
        "Emergency walk-ins accepted based on availability",
      ],
    },
    {
      icon: CreditCard,
      title: "Billing and Insurance",
      content: [
        "We accept most major insurance plans",
        "Co-payments are due at time of service",
        "Self-pay options available for uninsured patients",
        "Payment plans available for qualifying families",
        "Billing statements sent monthly",
      ],
    },
    {
      icon: Scale,
      title: "Telehealth Services",
      content: [
        "Virtual consultations available for eligible conditions",
        "Requires stable internet connection and video capability",
        "Parent/guardian must be present during telehealth visits",
        "Not all services available via telehealth",
        "In-person follow-up may be required",
      ],
    },
    {
      icon: AlertCircle,
      title: "Medical Emergencies",
      content:
        "For life-threatening emergencies, call 911 immediately. Do not use our online portal or scheduling system for emergencies. Our office provides urgent care during business hours for non-life-threatening conditions.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-full bg-teal-100 p-3">
            <FileText className="h-8 w-8 text-teal-600" />
          </div>
          <h1 className="mb-2 font-bold text-3xl text-gray-900">
            Terms of Service
          </h1>
          <p className="text-gray-600">
            Please read these terms carefully before using our services
          </p>
          <p className="mt-2 text-gray-500 text-sm">
            Effective Date: {effectiveDate}
          </p>
        </div>

        {/* Introduction */}
        <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />
            <div>
              <h2 className="mb-2 font-semibold text-lg text-yellow-900">
                Important Legal Notice
              </h2>
              <p className="text-yellow-800">
                These Terms of Service constitute a legally binding agreement
                between you and Smart Clinic Pediatric Care. By using our
                services, you acknowledge that you have read, understood, and
                agree to be bound by these terms.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {termsSections.map((section) => (
            <div
              className="rounded-lg border bg-white p-6 shadow-sm"
              key={section.title.toString()}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-teal-100 p-2">
                  <section.icon className="h-5 w-5 text-teal-600" />
                </div>
                <h2 className="font-semibold text-gray-900 text-xl">
                  {section.title}
                </h2>
              </div>
              {Array.isArray(section.content) ? (
                <ul className="ml-4 space-y-2">
                  {section.content.map((item) => (
                    <li
                      className="flex items-start gap-2"
                      key={item.toString()}
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700">{section.content}</p>
              )}
            </div>
          ))}
        </div>

        {/* Liability Section */}
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-3 font-semibold text-lg text-red-900">
            Limitation of Liability
          </h2>
          <p className="text-red-800">
            Smart Clinic Pediatric Care shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages resulting
            from your use of our services. Our total liability shall not exceed
            the amount paid for services rendered in the past 12 months.
          </p>
        </div>

        {/* Contact Section */}
        <div className="mt-8 rounded-lg border border-teal-200 bg-teal-50 p-6">
          <div className="flex flex-col items-center text-center">
            <Mail className="mb-3 h-8 w-8 text-teal-600" />
            <h2 className="mb-2 font-semibold text-teal-900 text-xl">
              Questions About Terms?
            </h2>
            <p className="mb-4 text-teal-800">
              Contact our legal department for questions about these Terms of
              Service
            </p>
            <a
              className="text-teal-700 hover:underline"
              href="mailto:legal@smartclinic.com"
            >
              legal@smartclinic.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
