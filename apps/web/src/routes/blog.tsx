// src/routes/blog.tsx
import {
  RiArrowRightLine,
  RiCalendarLine,
  RiEyeLine,
  RiHospitalLine,
  RiMailLine,
  RiMapPinLine,
  RiPhoneLine,
  RiSearchLine,
  RiTeamLine,
  RiTwitterXLine,
} from "@remixicon/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
});

function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
            <Link to="/blog" className="font-medium text-blue-600">
              Blog
            </Link>
            <Link
              to="/careers"
              className="text-gray-600 transition hover:text-blue-600"
            >
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
          <h1 className="mb-4 font-bold text-4xl md:text-5xl">
            PediatricCare Blog
          </h1>
          <p className="mx-auto max-w-2xl text-lg opacity-90">
            Insights, updates, and best practices for modern pediatric care
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="border-b bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-md flex-1">
              <RiSearchLine className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 font-medium text-sm transition ${
                    selectedCategory === category.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {filteredPosts.length > 0 &&
        selectedCategory === "all" &&
        !searchTerm && (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="group overflow-hidden rounded-2xl bg-white shadow-lg transition hover:shadow-xl">
                <div className="grid md:grid-cols-2">
                  <div
                    className="h-64 bg-center bg-cover md:h-full"
                    style={{ backgroundImage: `url(${featuredPost.image})` }}
                  />
                  <div className="p-8">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-600 text-sm">
                        Featured
                      </span>
                      <span className="text-gray-500 text-sm">
                        {featuredPost.readTime}
                      </span>
                    </div>
                    <h2 className="mb-4 font-bold text-2xl text-gray-900">
                      {featuredPost.title}
                    </h2>
                    <p className="mb-4 text-gray-600">{featuredPost.excerpt}</p>
                    <div className="mb-4 flex items-center gap-4 text-gray-500 text-sm">
                      <span className="flex items-center gap-1">
                        <RiCalendarLine className="size-4" />
                        {featuredPost.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <RiEyeLine className="size-4" />
                        {featuredPost.views} views
                      </span>
                    </div>
                    <Link
                      to="/blog/$slug"
                      params={{ slug: featuredPost.slug }}
                      className="inline-flex items-center gap-2 font-medium text-blue-600 transition hover:gap-3"
                    >
                      Read More
                      <RiArrowRightLine className="size-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      {/* Blog Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredPosts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-500 text-lg">
                No articles found. Try a different search term.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="group overflow-hidden rounded-2xl bg-white shadow-lg transition hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 font-medium text-gray-700 text-sm backdrop-blur-sm">
                      {post.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-3 text-gray-500 text-sm">
                      <span className="flex items-center gap-1">
                        <RiCalendarLine className="size-4" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <RiClockLine className="size-4" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="mb-2 font-bold text-gray-900 text-xl group-hover:text-blue-600">
                      <Link to="/blog/$slug" params={{ slug: post.slug }}>
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mb-4 text-gray-600">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {post.author}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {post.authorRole}
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/blog/$slug"
                        params={{ slug: post.slug }}
                        className="font-medium text-blue-600 text-sm transition hover:text-blue-700"
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-linear-to-r from-blue-600 to-purple-600 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 font-bold text-3xl">
            Subscribe to Our Newsletter
          </h2>
          <p className="mx-auto mb-8 max-w-2xl opacity-90">
            Get the latest pediatric healthcare insights and updates delivered
            to your inbox
          </p>
          <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-lg px-4 py-2 text-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-white px-6 py-2 font-semibold text-blue-600 transition hover:bg-gray-100"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
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
                  <RiTeamLine className="size-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Quick Links</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-blue-600">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="hover:text-blue-600">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-blue-600">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Resources</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>
                  <a href="/contact" className="hover:text-blue-600">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/api-reference" className="hover:text-blue-600">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="/support" className="hover:text-blue-600">
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Contact</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-center gap-2">
                  <RiMailLine className="size-4" />
                  hello@pediatriccare.com
                </li>
                <li className="flex items-center gap-2">
                  <RiPhoneLine className="size-4" />
                  +1 (555) 123-4567
                </li>
                <li className="flex items-center gap-2">
                  <RiMapPinLine className="size-4" />
                  123 Healthcare Ave, Suite 100
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const categories = [
  { id: "all", name: "All Posts" },
  { id: "Clinical", name: "Clinical Care" },
  { id: "Technology", name: "Technology" },
  { id: "Growth", name: "Growth & Development" },
  { id: "Immunization", name: "Immunization" },
  { id: "Practice Management", name: "Practice Management" },
];

const featuredPost = {
  id: "featured",
  slug: "ai-pediatric-diagnostics",
  title: "How AI is Transforming Pediatric Diagnostics",
  excerpt:
    "Discover how artificial intelligence is revolutionizing the way we diagnose and treat childhood diseases, improving accuracy and outcomes.",
  date: "March 15, 2024",
  readTime: "8 min read",
  views: "2.5K",
  category: "Technology",
  image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
  author: "Dr. Sarah Johnson",
  authorRole: "Chief Medical Officer",
};

const blogPosts = [
  {
    id: 1,
    slug: "vaccination-schedule-2024",
    title: "Complete Vaccination Schedule Guide 2024",
    excerpt:
      "Stay up-to-date with the latest CDC recommendations for childhood immunizations.",
    date: "March 10, 2024",
    readTime: "6 min read",
    category: "Immunization",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800",
    author: "Dr. Michael Chen",
    authorRole: "Pediatric Immunologist",
  },
  {
    id: 2,
    slug: "growth-chart-percentiles",
    title: "Understanding Growth Chart Percentiles",
    excerpt:
      "A comprehensive guide to interpreting WHO growth standards for pediatric patients.",
    date: "March 5, 2024",
    readTime: "5 min read",
    category: "Growth",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800",
    author: "Dr. Emily Rodriguez",
    authorRole: "Developmental Pediatrician",
  },
  {
    id: 3,
    slug: "telehealth-pediatrics-best-practices",
    title: "Best Practices for Pediatric Telehealth",
    excerpt:
      "Optimizing virtual care for young patients with proven strategies and tools.",
    date: "February 28, 2024",
    readTime: "7 min read",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800",
    author: "Dr. James Wilson",
    authorRole: "Telehealth Director",
  },
  {
    id: 4,
    slug: "asd-early-detection",
    title: "Early Detection of Autism Spectrum Disorder",
    excerpt:
      "Key milestones and screening tools for early intervention in ASD.",
    date: "February 20, 2024",
    readTime: "9 min read",
    category: "Clinical",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800",
    author: "Dr. Lisa Thompson",
    authorRole: "Child Psychologist",
  },
  {
    id: 5,
    slug: "practice-management-software",
    title: "Choosing the Right Practice Management Software",
    excerpt:
      "Essential features to look for in pediatric clinic management solutions.",
    date: "February 15, 2024",
    readTime: "6 min read",
    category: "Practice Management",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    author: "Mark Williams",
    authorRole: "Healthcare IT Consultant",
  },
  {
    id: 6,
    slug: "nutritional-guidelines-infants",
    title: "Updated Nutritional Guidelines for Infants",
    excerpt: "Evidence-based recommendations for infant feeding and nutrition.",
    date: "February 10, 2024",
    readTime: "5 min read",
    category: "Clinical",
    image: "https://images.unsplash.com/photo-1511689670976-1e555d6fd6ba?w=800",
    author: "Dr. Rachel Green",
    authorRole: "Pediatric Nutritionist",
  },
];
