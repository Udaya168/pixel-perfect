import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Workplace Safety Sentinel — See Risks. Act Earlier." },
      { name: "description", content: "Industrial AI safety command centre for PipeGen, TensorRT and DeepStream pipelines." },
      { property: "og:title", content: "Workplace Safety Sentinel" },
      { property: "og:description", content: "Industrial AI safety command centre for edge vision pipelines." },
    ],
  }),
});
