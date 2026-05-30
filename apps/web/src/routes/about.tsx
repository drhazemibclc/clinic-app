import { Button } from "@clinic-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@clinic-app/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Baby,
  Calendar,
  Heart,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  const stats = [
    {
      icon: Users,
      value: "2,500+",
      label: "Happy Children",
      color: "text-blue-600",
    },
    {
      icon: Stethoscope,
      value: "15+",
      label: "Expert Pediatricians",
      color: "text-teal-600",
    },
    {
      icon: Calendar,
      value: "10,000+",
      label: "Appointments",
      color: "text-purple-600",
    },
    {
      icon: Heart,
      value: "98%",
      label: "Parent Satisfaction",
      color: "text-pink-600",
    },
  ];

  const values = [
    {
      title: "Compassionate Care",
      description:
        "Every child receives personalized attention in a warm, welcoming environment.",
      icon: Heart,
    },
    {
      title: "Expert Team",
      description:
        "Board-certified pediatricians and specialists dedicated to children's health.",
      icon: Users,
    },
    {
      title: "Modern Technology",
      description:
        "Digital health records, telemedicine, and advanced diagnostic tools.",
      icon: Shield,
    },
    {
      title: "Family-Centered",
      description:
        "We partner with parents to make informed decisions about their child's care.",
      icon: Baby,
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-blue-50 via-teal-50 to-green-50 py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-linear-to-br from-blue-200/30 to-teal-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-linear-to-br from-purple-200/30 to-pink-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2">
              <Heart className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700 text-sm">
                Serving families since 2015
              </span>
            </div>

            <h1 className="mb-6 bg-linear-to-r from-blue-600 via-teal-600 to-green-600 bg-clip-text font-bold text-5xl text-transparent tracking-tight sm:text-6xl">
              Where Little Hearts Get Big Care
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-gray-600 text-lg">
              Smart Clinic provides comprehensive pediatric care in a nurturing
              environment. Our team of board-certified pediatricians is
              dedicated to your child's health and development.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="default">
                <Link
                  className="inline-flex items-center gap-2"
                  to="/dashboard"
                >
                  <Stethoscope className="h-5 w-5" />
                  Meet Our Team
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  className="inline-flex items-center gap-2"
                  to="/dashboard/appointments"
                >
                  <Calendar className="h-5 w-5" />
                  Schedule Visit
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-gray-100 border-b bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div className="text-center" key={stat.label.toString()}>
                <div className="mb-3 flex justify-center">
                  <div className="rounded-full bg-gray-100 p-3">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="font-bold text-2xl text-gray-900">{stat.value}</p>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="island-kicker mb-2 font-semibold text-sm text-teal-600 uppercase tracking-wide">
                Our Story
              </p>
              <h2 className="mb-4 font-bold text-3xl text-gray-900 sm:text-4xl">
                A Clinic Built on Trust and Innovation
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2015, Smart Clinic was born from a simple idea:
                  every child deserves access to exceptional healthcare in a
                  warm, welcoming environment. What started as a small practice
                  with two pediatricians has grown into a trusted healthcare
                  provider serving thousands of families.
                </p>
                <p>
                  We combine traditional pediatric expertise with cutting-edge
                  technology to provide the best possible care. From digital
                  health records that give parents instant access to their
                  child's information, to telemedicine appointments that bring
                  the doctor to your living room, we're constantly innovating to
                  make healthcare more accessible and convenient.
                </p>
                <p>
                  Our commitment to excellence has earned us recognition as a
                  leading pediatric practice, but our greatest reward is the
                  trust parents place in us to care for their most precious
                  treasures.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-br from-blue-400 to-teal-400 opacity-20 blur-2xl" />
              <div className="relative rounded-2xl border border-gray-200 bg-linear-to-br from-white to-gray-50 p-8 shadow-lg">
                <div className="mb-6 text-teal-600">
                  <Heart className="h-12 w-12" />
                </div>
                <h3 className="mb-4 font-semibold text-2xl text-gray-900">
                  Our Mission
                </h3>
                <p className="mb-6 text-gray-600">
                  To provide compassionate, comprehensive, and accessible
                  pediatric care that empowers families and helps every child
                  thrive.
                </p>
                <div className="border-gray-200 border-t pt-6">
                  <h4 className="mb-2 font-semibold text-gray-900">
                    Our Vision
                  </h4>
                  <p className="text-gray-600">
                    A world where every child has access to quality healthcare
                    and the opportunity to reach their full potential.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-bold text-3xl text-gray-900">
              Our Core Values
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card
                className="group transition-all hover:shadow-lg"
                key={value.title}
              >
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 text-teal-600 transition-transform group-hover:scale-110">
                    <value.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-gray-900">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 to-teal-600 p-8 text-center text-white shadow-xl md:p-12">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white" />
            </div>

            <div className="relative">
              <h2 className="mb-4 font-bold text-3xl">
                Ready to join our family?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-blue-100">
                Schedule your child's first appointment today and experience the
                Smart Clinic difference
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  asChild
                  className="bg-white text-teal-600 hover:bg-gray-100"
                >
                  <Link to="/dashboard/appointments">
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Appointment
                  </Link>
                </Button>
                <Button
                  asChild
                  className="border-2 border-white/30 bg-transparent text-white hover:bg-white/10"
                  variant="outline"
                >
                  <Link to="/dashboard">
                    <Users className="mr-2 h-5 w-5" />
                    Meet the Team
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
