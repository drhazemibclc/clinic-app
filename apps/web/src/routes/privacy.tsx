// src/routes/privacy.tsx
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Database, Eye, Lock, Mail, Shield } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const lastUpdated = "January 15, 2024";

  const sections = [
    {
      icon: Shield,
      title: "Information We Collect",
      content: [
        "Personal information (name, date of birth, address, contact details)",
        "Medical history, immunization records, growth data, and treatment information",
        "Insurance information and billing details",
        "Emergency contact information",
        "Appointment history and scheduling information",
        "Communication preferences and consent forms",
      ],
    },
    {
      icon: Lock,
      title: "How We Use Your Information",
      content: [
        "Provide medical care and treatment services",
        "Schedule appointments and send reminders",
        "Process insurance claims and billing",
        "Communicate with parents/guardians about their child's health",
        "Improve our services and patient experience",
        "Comply with legal and regulatory requirements",
      ],
    },
    {
      icon: Eye,
      title: "Information Sharing",
      content: [
        "We never sell your personal information to third parties",
        "Information shared with healthcare providers involved in your child's care",
        "Insurance companies for billing purposes (with your consent)",
        "Public health authorities as required by law (e.g., immunization records)",
        "With your explicit written consent for any other sharing",
      ],
    },
    {
      icon: Database,
      title: "Data Security",
      content: [
        "HIPAA-compliant secure servers and encryption",
        "Regular security audits and vulnerability assessments",
        "Access controls and authentication measures",
        "Staff training on privacy and security practices",
        "Secure data backup and disaster recovery procedures",
        "Breach notification procedures as required by law",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-full bg-teal-100 p-3">
            <Shield className="h-8 w-8 text-teal-600" />
          </div>
          <h1 className="mb-2 font-bold text-3xl text-gray-900">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Protecting your child's health information is our priority
          </p>
          <p className="mt-2 text-gray-500 text-sm">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-2 font-semibold text-blue-900 text-xl">
            Our Commitment to Privacy
          </h2>
          <p className="text-blue-800">
            At Smart Clinic Pediatric Care, we are committed to protecting the
            privacy and security of your child's health information. This
            Privacy Policy explains how we collect, use, and safeguard your
            information in compliance with HIPAA and other applicable privacy
            laws.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div
              className="rounded-lg border bg-white p-6 shadow-sm"
              key={section.title.toString()}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-teal-100 p-2">
                  <section.icon className="h-5 w-5 text-teal-600" />
                </div>
                <h2 className="font-semibold text-gray-900 text-xl">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-2 pl-4">
                {section.content.map((items) => (
                  <li className="flex items-start gap-2" key={items.toString()}>
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                    <span className="text-gray-700">{items}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Your Rights Section */}
        <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900 text-xl">
            Your Rights Regarding PHI
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">
                Right to Access
              </h3>
              <p className="text-gray-600 text-sm">
                Request copies of your child's medical records
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">
                Right to Amend
              </h3>
              <p className="text-gray-600 text-sm">
                Request corrections to inaccurate information
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">
                Right to Restrictions
              </h3>
              <p className="text-gray-600 text-sm">
                Request limitations on how we use your information
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold text-gray-900">
                Right to Accounting
              </h3>
              <p className="text-gray-600 text-sm">
                Request a record of information disclosures
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 rounded-lg border border-teal-200 bg-teal-50 p-6">
          <div className="flex flex-col items-center text-center">
            <Mail className="mb-3 h-8 w-8 text-teal-600" />
            <h2 className="mb-2 font-semibold text-teal-900 text-xl">
              Questions About Privacy?
            </h2>
            <p className="mb-4 text-teal-800">
              Contact our Privacy Officer for any questions about this policy or
              your rights
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <a
                className="text-teal-700 hover:underline"
                href="mailto:privacy@smartclinic.com"
              >
                privacy@smartclinic.com
              </a>
              <span className="hidden text-teal-400 sm:inline">|</span>
              <a
                className="text-teal-700 hover:underline"
                href="tel:+15551234567"
              >
                (555) 123-4567
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
