<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules
- All data access goes through hooks in `src/hooks/use-data.tsx`, which switch between `src/mocks/` (demo) and `src/services/backend.ts` (live) — keeps demo and real records strictly separated.
- Backend payloads are validated with zod schemas in `src/types/` — the real pipeline output format is unverified.
- The browser never runs detection or talks to MQTT directly; it only renders backend-provided streams/metadata — perception lives in the PipeGen/TensorRT/DeepStream pipeline.
- Never display a measured value (FPS, latency, GPU, accuracy) unless the backend reported it — demo mode leaves them null.
- Backend contract is documented in `INTEGRATION.md`; update it with any endpoint change.
- Shared page hierarchy and operational surfaces are owned by global semantic tokens, AppShell, and common presentation components — keeps all monitoring pages visually consistent without changing data logic.
- Architecture exploration uses structured diagram data and a shared React Flow viewer with node details, separate from operational data hooks — keeps pan/zoom and export maintainable without implying live pipeline execution.
