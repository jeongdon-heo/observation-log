import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "세상 돋보기",
    short_name: "세상돋보기",
    description: "초등학교 자연 관찰 기록 웹 앱",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#22c55e",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
