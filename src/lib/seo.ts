export const pageHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} · Workplace Safety Sentinel` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · Workplace Safety Sentinel` },
    { property: "og:description", content: description },
  ],
});
