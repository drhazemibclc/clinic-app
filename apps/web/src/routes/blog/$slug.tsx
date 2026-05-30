// src/routes/blog/$slug.tsx
import {
  RiArrowLeftLine,
  RiCalendarLine,
  RiHospitalLine,
  RiShareLine,
} from "@remixicon/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
});

function BlogPostPage() {
  const [isLiked, setIsLiked] = useState(false);
  const { slug } = Route.useParams();
  const post = blogPosts.find((p) => p.slug === slug) || featuredPost;

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
          </div>
          <Link
            to="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Blog Post */}
      <article className="py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <Link
            to="/blog"
            className="mb-8 inline-flex items-center gap-2 text-gray-600 transition hover:text-blue-600"
          >
            <RiArrowLeftLine className="size-4" />
            Back to Blog
          </Link>

          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <img
              src={post.image}
              alt={post.title}
              className="h-96 w-full object-cover"
            />

            <div className="p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-600 text-sm">
                  {post.category}
                </span>
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                  <span className="flex items-center gap-1">
                    <RiCalendarLine className="size-4" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-4" />
                    {post.readTime}
                  </span>
                </div>
              </div>

              <h1 className="mb-6 font-bold text-3xl text-gray-900 md:text-4xl">
                {post.title}
              </h1>

              <div className="mb-8 flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{post.author}</p>
                    <p className="text-gray-500 text-sm">{post.authorRole}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="rounded-lg border px-4 py-2 transition hover:bg-gray-50"
                  >
                    <RiShareLine className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLiked(!isLiked)}
                    className={`rounded-lg border px-4 py-2 transition ${
                      isLiked ? "bg-red-50 text-red-600" : "hover:bg-gray-50"
                    }`}
                  >
                    ❤️ {isLiked ? "Liked" : "Like"}
                  </button>
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                <p className="mb-4 text-gray-700 text-lg leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris.
                </p>
                <h2>Key Takeaways</h2>
                <ul>
                  <li>
                    Understanding the importance of early childhood development
                  </li>
                  <li>Latest research findings in pediatric care</li>
                  <li>Practical implementation strategies for clinics</li>
                </ul>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse
                  cillum dolore eu fugiat nulla pariatur. Excepteur sint
                  occaecat cupidatat non proident, sunt in culpa qui officia
                  deserunt mollit anim id est laborum.
                </p>
                <blockquote>
                  "The health of our children is the foundation of a thriving
                  society. Every investment in pediatric care pays dividends for
                  generations."
                </blockquote>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                  accusantium doloremque laudantium, totam rem aperiam, eaque
                  ipsa quae ab illo inventore veritatis et quasi architecto
                  beatae vitae dicta sunt explicabo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 font-bold text-2xl text-gray-900">
            Related Articles
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                to="/blog/$slug"
                params={{ slug: related.slug }}
                className="group"
              >
                <div className="overflow-hidden rounded-xl bg-white shadow-md transition group-hover:shadow-xl">
                  <img
                    src={related.image}
                    alt={related.title}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-blue-600">
                      {related.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{related.excerpt}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>&copy; 2024 PediatricCare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Mock data - same as blog page
const featuredPost = {
  slug: "ai-pediatric-diagnostics",
  title: "How AI is Transforming Pediatric Diagnostics",
  excerpt:
    "Discover how artificial intelligence is revolutionizing the way we diagnose and treat childhood diseases",
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
];

const relatedPosts = blogPosts.slice(0, 3);
