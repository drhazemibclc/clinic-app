// src/routes/careers.tsx
import {
  RiArrowRightLine,
  RiAwardLine,
  RiBuildingLine,
  RiGraduationCapLine,
  RiHospitalLine,
  RiMapPinLine,
  RiTeamLine,
  RiTimeLine,
  RiVidiconLine,
} from "@remixicon/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/careers")({
  component: CareersPage,
});

function CareersPage() {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const filteredJobs = jobOpenings.filter((job) => {
    const matchesDepartment =
      selectedDepartment === "all" || job.department === selectedDepartment;
    const matchesLocation =
      selectedLocation === "all" || job.location === selectedLocation;
    return matchesDepartment && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <RiHospitalLine className="size-8 text-blue-600" />
            <span className="font-bold text-gray-800 text-xl">
              PediatricCare
            </span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              to="/"
              className="text-gray-600 transition hover:text-blue-600"
            >
              Home
            </Link>
            <Link
              to="/blog"
              className="text-gray-600 transition hover:text-blue-600"
            >
              Blog
            </Link>
            <Link to="/careers" className="font-medium text-blue-600">
              Careers
            </Link>
            <Link
              to="/about"
              className="text-gray-600 transition hover:text-blue-600"
            >
              About
            </Link>
          </div>
          <Link
            to="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-linear-to-r from-blue-600 to-purple-600 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 font-bold text-4xl md:text-5xl">Join Our Team</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg opacity-90">
            Help us transform pediatric healthcare through innovation and
            compassionate care
          </p>
          <Link
            to="/careers#openings"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 transition hover:bg-gray-100"
          >
            View Open Positions
            <RiArrowRightLine className="size-5" />
          </Link>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center font-bold text-3xl text-gray-900">
            Why Join PediatricCare?
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="mx-auto mb-4 inline-flex rounded-xl bg-blue-100 p-3 text-blue-600">
                  {benefit.icon}
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 text-xl">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center font-bold text-3xl text-gray-900">
            Our Core Values
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl bg-white p-6 shadow-md"
              >
                <div className="mb-4 text-blue-600">{value.icon}</div>
                <h3 className="mb-2 font-semibold text-gray-900 text-xl">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="openings" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center font-bold text-3xl text-gray-900">
            Open Positions
          </h2>

          {/* Filters */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:justify-center">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Clinical">Clinical</option>
              <option value="Product">Product</option>
              <option value="Sales">Sales</option>
            </select>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Locations</option>
              <option value="Remote">Remote</option>
              <option value="San Francisco">San Francisco</option>
              <option value="New York">New York</option>
              <option value="London">London</option>
            </select>
          </div>

          {/* Job Listings */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-gray-500 text-lg">
                  No open positions match your criteria.
                </p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl bg-white p-6 shadow-md transition hover:shadow-lg"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900 text-xl">
                        {job.title}
                      </h3>
                      <div className="mb-3 flex flex-wrap gap-3 text-gray-600 text-sm">
                        <span className="flex items-center gap-1">
                          <RiBuildingLine className="size-4" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <RiMapPinLine className="size-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <RiTimeLine className="size-4" />
                          {job.type}
                        </span>
                      </div>
                      <p className="text-gray-600">{job.description}</p>
                    </div>
                    <Link
                      to="/careers/$jobId"
                      params={{ jobId: job.id.toString() }}
                      className="shrink-0 rounded-lg bg-blue-600 px-6 py-2 text-center text-white transition hover:bg-blue-700 md:px-4"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Hiring Process */}
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center font-bold text-3xl text-gray-900">
            Our Hiring Process
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            {process.map((step, index) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-600 font-bold text-2xl text-white">
                  {index + 1}
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 text-lg">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
                {index < 3 && (
                  <div className="absolute top-8 -right-4 hidden text-gray-300 lg:block">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Employee Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center font-bold text-3xl text-gray-900">
            What Our Team Says
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-2xl bg-white p-6 shadow-md"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-linear-to-r from-blue-600 to-purple-600 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 font-bold text-3xl">
            Ready to Make a Difference?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl opacity-90">
            Join us in our mission to improve pediatric healthcare worldwide
          </p>
          <Link
            to="/careers#openings"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 transition hover:bg-gray-100"
          >
            Explore Opportunities
            <RiArrowRightLine className="size-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>
            &copy; 2024 PediatricCare. All rights reserved. Equal Opportunity
            Employer
          </p>
        </div>
      </footer>
    </div>
  );
}

const benefits = [
  {
    icon: <RiAwardLine className="size-8" />,
    title: "Competitive Compensation",
    description: "Excellent salary and equity packages",
  },
  {
    icon: <RiGraduationCapLine className="size-8" />,
    title: "Learning & Development",
    description: "$5,000 annual learning stipend",
  },
  {
    icon: <RiTeamLine className="size-8" />,
    title: "Great Culture",
    description: "Collaborative and inclusive environment",
  },
  {
    icon: <RiVidiconLine className="size-8" />,
    title: "Work-Life Balance",
    description: "Flexible hours and remote options",
  },
];

const values = [
  {
    icon: "❤️",
    title: "Patient First",
    description: "Always prioritize the well-being of our young patients",
  },
  {
    icon: "💡",
    title: "Innovation",
    description: "Embrace cutting-edge technology and creative solutions",
  },
  {
    icon: "🤝",
    title: "Integrity",
    description: "Act with honesty and transparency in everything we do",
  },
];

const process = [
  { title: "Application", description: "Submit your resume and cover letter" },
  {
    title: "Initial Screen",
    description: "30-min chat with our recruiting team",
  },
  {
    title: "Technical Interview",
    description: "Deep dive into your skills and experience",
  },
  { title: "Offer", description: "Welcome to the PediatricCare team!" },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Senior Software Engineer",
    quote:
      "Working here has been incredibly rewarding. The impact we make on children's health is truly inspiring.",
  },
  {
    name: "Dr. Marcus Brown",
    role: "Medical Director",
    quote:
      "The combination of medical expertise and technical innovation here is unmatched.",
  },
  {
    name: "Emma Rodriguez",
    role: "Product Manager",
    quote:
      "I love how everyone is passionate about improving pediatric care. It's more than just a job.",
  },
];

const jobOpenings = [
  {
    id: 1,
    title: "Senior Full Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Build cutting-edge pediatric healthcare solutions using React, Node.js, and TypeScript.",
  },
  {
    id: 2,
    title: "Pediatric Clinical Specialist",
    department: "Clinical",
    location: "San Francisco",
    type: "Full-time",
    description:
      "Provide clinical insights and help shape our product roadmap.",
  },
  {
    id: 3,
    title: "Product Manager",
    department: "Product",
    location: "New York",
    type: "Full-time",
    description: "Lead product development for our core clinical platform.",
  },
  {
    id: 4,
    title: "Sales Director",
    department: "Sales",
    location: "Remote",
    type: "Full-time",
    description:
      "Drive growth and build relationships with healthcare providers.",
  },
  {
    id: 5,
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Manage cloud infrastructure and ensure HIPAA compliance.",
  },
];
