import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mindora — Your Friendly AI Study Partner",
    short_name: "Mindora",
    description:
      "Upload your course materials and let Mindora teach, tutor, and quiz you on them.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#6366f1",
    icons: [
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/logo.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
      { src: "/logo.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
