// src/routes/index.tsx

import {
  RiArrowRightLine,
  RiBarChartLine,
  RiBrainLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiFacebookCircleLine,
  RiGithubLine,
  RiHeartPulseLine,
  RiHospitalLine,
  RiLinkedinBoxLine,
  RiMailLine,
  RiMapPinLine,
  RiPhoneLine,
  RiRobotLine,
  RiScalesLine,
  RiShieldCheckLine,
  RiSyringeLine,
  RiTwitterXLine,
  RiUserHeartLine,
} from "@remixicon/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  // Fix 3.6 — use a longer staleTime for the status indicator so it doesn't
  // fire a network request on every landing page visit.
  const healthCheck = useQuery({
    ...orpc.healthCheck.queryOptions(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 via-white to-white">
      {/* Navigation */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 shadow-lg backdrop-blur-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <RiHospitalLine className="size-8 text-blue-600" />
            <span className="font-bold text-gray-800 text-xl">
              PediatricCare
            </span>
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-600 text-xs">
              Smart Clinic
            </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-gray-600 transition hover:text-blue-600"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="text-gray-600 transition hover:text-blue-600"
            >
              Benefits
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 transition hover:text-blue-600"
            >
              Testimonials
            </a>
            <a
              href="#contact"
              className="text-gray-600 transition hover:text-blue-600"
            >
              Contact
            </a>
          </div>

          <div className="flex gap-3">
            <Link
              to="/login"
              className="rounded-lg border border-blue-600 px-4 py-2 text-blue-600 transition hover:bg-blue-50"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-r from-blue-100/50 to-purple-100/50" />
          <div className="absolute top-0 right-0 size-96 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 size-96 rounded-full bg-purple-200/30 blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-green-700 text-sm">
                <div
                  className={`mr-2 h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
                />
                {healthCheck.isLoading
                  ? "Connecting..."
                  : healthCheck.data
                    ? "System Online"
                    : "Status Check"}
              </div>

              <h1 className="mb-6 font-bold text-5xl text-gray-900 leading-tight md:text-6xl lg:text-7xl">
                Smart Pediatric Care
                <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}
                  for Every Child
                </span>
              </h1>

              <p className="mb-8 text-gray-600 text-lg md:text-xl">
                AI-powered pediatric clinic management system that streamlines
                patient care, growth tracking, immunizations, and clinical
                workflows - all in one platform.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Start Free Trial
                  <RiArrowRightLine className="size-5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  View Features
                </a>
              </div>

              <div className="mt-8 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="size-10 rounded-full border-2 border-white bg-linear-to-br from-blue-400 to-purple-400"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_) => (
                      <svg
                        key={_.toString()}
                        className="size-5 fill-yellow-400 text-yellow-400"
                        viewBox="0 0 20 20"
                      >
                        <title>Star</title>
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm">
                    Trusted by 500+ clinics
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 p-1 shadow-2xl">
                <div className="rounded-xl bg-white p-6">
                  <div className="mb-4 flex items-center gap-2 border-b pb-4">
                    <div className="flex gap-1">
                      <div className="size-3 rounded-full bg-red-500" />
                      <div className="size-3 rounded-full bg-yellow-500" />
                      <div className="size-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-gray-600 text-sm">
                      Dashboard Preview
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-blue-50 p-3">
                        <RiUserHeartLine className="mb-2 size-6 text-blue-600" />
                        <div className="font-bold text-2xl">1,234</div>
                        <div className="text-gray-600 text-xs">
                          Active Patients
                        </div>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3">
                        <RiCalendarLine className="mb-2 size-6 text-green-600" />
                        <div className="font-bold text-2xl">89</div>
                        <div className="text-gray-600 text-xs">
                          Today's Appointments
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-purple-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-purple-900 text-sm">
                          Growth Chart - Patient #1234
                        </span>
                        <RiBarChartLine className="size-4 text-purple-600" />
                      </div>
                      <div className="h-24 rounded bg-linear-to-r from-purple-200 to-pink-200" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Immunization Rate</span>
                        <span className="font-semibold text-green-600">
                          94%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-[94%] rounded-full bg-green-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 animate-bounce rounded-full bg-white px-4 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <RiRobotLine className="size-5 text-purple-600" />
                  <span className="font-medium text-purple-900 text-sm">
                    AI-Powered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-bold text-3xl text-gray-900 md:text-4xl">
              Comprehensive Pediatric Care Platform
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600 text-lg">
              Everything you need to provide exceptional care for your young
              patients
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border bg-white p-6 transition-all hover:shadow-xl"
              >
                <div className="mb-4 inline-flex rounded-xl bg-linear-to-br from-blue-500 to-purple-600 p-3 text-white">
                  {feature.icon}
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 text-xl">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-linear-to-r from-blue-600 to-purple-600 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 text-center md:grid-cols-4">
            <div>
              <div className="font-bold text-4xl md:text-5xl">500+</div>
              <div className="mt-2 opacity-90">Active Clinics</div>
            </div>
            <div>
              <div className="font-bold text-4xl md:text-5xl">50K+</div>
              <div className="mt-2 opacity-90">Pediatric Patients</div>
            </div>
            <div>
              <div className="font-bold text-4xl md:text-5xl">99.9%</div>
              <div className="mt-2 opacity-90">Uptime</div>
            </div>
            <div>
              <div className="font-bold text-4xl md:text-5xl">24/7</div>
              <div className="mt-2 opacity-90">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 font-bold text-3xl text-gray-900 md:text-4xl">
                Why Choose Our Platform?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex items-start gap-3">
                    <RiCheckboxCircleLine className="mt-1 size-5 shrink-0 text-green-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-linear-to-br from-blue-50 to-purple-50 p-8">
              <div className="mb-6 text-center">
                <RiShieldCheckLine className="mx-auto mb-3 size-12 text-blue-600" />
                <h3 className="font-bold text-2xl text-gray-900">
                  HIPAA Compliant
                </h3>
                <p className="mt-2 text-gray-600">
                  Enterprise-grade security for patient data
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-gray-700">Data Encryption</span>
                  <span className="text-green-600">✓ AES-256</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-gray-700">Access Controls</span>
                  <span className="text-green-600">✓ RBAC</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-gray-700">Audit Logs</span>
                  <span className="text-green-600">✓ Complete</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Backup & Recovery</span>
                  <span className="text-green-600">✓ Automated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-linear-to-r from-blue-600 to-purple-600 p-12 text-center text-white">
            <h2 className="mb-4 font-bold text-3xl md:text-4xl">
              Ready to Transform Your Pediatric Practice?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg opacity-90">
              Join hundreds of clinics already using our platform to deliver
              better care
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 transition hover:bg-gray-100"
            >
              Get Started Today
              <RiArrowRightLine className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <RiHospitalLine className="size-8 text-blue-600" />
                <span className="font-bold text-gray-800 text-xl">
                  PediatricCare
                </span>
              </div>
              <p className="mt-4 text-gray-600 text-sm">
                Smart pediatric clinic management for modern healthcare
                providers.
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href="/#"
                  className="text-gray-400 transition hover:text-blue-600"
                >
                  <RiTwitterXLine className="size-5" />
                </a>
                <a
                  href="/#"
                  className="text-gray-400 transition hover:text-blue-600"
                >
                  <RiFacebookCircleLine className="size-5" />
                </a>
                <a
                  href="/#"
                  className="text-gray-400 transition hover:text-blue-600"
                >
                  <RiLinkedinBoxLine className="size-5" />
                </a>
                <a
                  href="/#"
                  className="text-gray-400 transition hover:text-blue-600"
                >
                  <RiGithubLine className="size-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Product</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>
                  <a href="#features" className="hover:text-blue-600">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#benefits" className="hover:text-blue-600">
                    Benefits
                  </a>
                </li>
                <li>
                  <a href="/api" className="hover:text-blue-600">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Company</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>
                  <a href="/about" className="hover:text-blue-600">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/blog" className="hover:text-blue-600">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/careers" className="hover:text-blue-600">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-blue-600">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Contact</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-center gap-2">
                  <RiMailLine className="size-4" />
                  <span>hello@pediatriccare.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <RiPhoneLine className="size-4" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <RiMapPinLine className="size-4" />
                  <span>123 Healthcare Ave, Suite 100</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t pt-8 text-center text-gray-600 text-sm">
            <p>
              &copy; 2024 PediatricCare. All rights reserved. HIPAA Compliant.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: <RiUserHeartLine className="size-6" />,
    title: "Patient Management",
    description:
      "Comprehensive patient profiles with medical history, growth tracking, and immunization records.",
  },
  {
    icon: <RiCalendarLine className="size-6" />,
    title: "Smart Scheduling",
    description:
      "AI-powered appointment scheduling with automatic reminders and waitlist management.",
  },
  {
    icon: <RiHeartPulseLine className="size-6" />,
    title: "Growth Analytics",
    description:
      "WHO-standard growth charts with percentile tracking and developmental milestones.",
  },
  {
    icon: <RiSyringeLine className="size-6" />,
    title: "Immunization Tracker",
    description:
      "Automated vaccine schedules, due date alerts, and inventory management.",
  },
  {
    icon: <RiBrainLine className="size-6" />,
    title: "Clinical Decision Support",
    description:
      "AI-assisted diagnosis suggestions and evidence-based treatment recommendations.",
  },
  {
    icon: <RiScalesLine className="size-6" />,
    title: "Analytics Dashboard",
    description:
      "Real-time insights on clinic performance, patient outcomes, and operational metrics.",
  },
];

const benefits = [
  {
    title: "Reduce Administrative Work",
    description:
      "Automate scheduling, billing, and documentation to focus on patient care.",
  },
  {
    title: "Improve Patient Outcomes",
    description:
      "Early intervention with growth monitoring and developmental screening.",
  },
  {
    title: "Increase Efficiency",
    description:
      "Streamline workflows with integrated EHR, prescriptions, and lab orders.",
  },
  {
    title: "Enhance Patient Experience",
    description:
      "Patient portal for appointment booking, results access, and communication.",
  },
  {
    title: "Data-Driven Decisions",
    description:
      "Comprehensive analytics to identify trends and optimize operations.",
  },
];
