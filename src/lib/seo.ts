export const pageHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} · SafeVio` },
    { name: "description", content: description },
    { property: "og:site_name", content: "SafeVio" },
    { property: "og:title", content: `${title} · SafeVio` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
