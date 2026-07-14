# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a GitHub issue, reporting a bug, or requesting a feature. | issue-creation | `C:\Users\salomonjp\.config\opencode\skills\issue-creation\SKILL.md` |
| When creating a pull request, opening a PR, or preparing changes for review. | branch-pr | `C:\Users\salomonjp\.config\opencode\skills\branch-pr\SKILL.md` |
| When user asks to create a new skill, add agent instructions, or document patterns for AI. | skill-creator | `C:\Users\salomonjp\.config\opencode\skills\skill-creator\SKILL.md` |
| When writing Go tests, using teatest, or adding test coverage. | go-testing | `C:\Users\salomonjp\.config\opencode\skills\go-testing\SKILL.md` |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen". | judgment-day | `C:\Users\salomonjp\.config\opencode\skills\judgment-day\SKILL.md` |
| JavaScript animation library, DOM/SVG animation, GSAP tweens, easing, responsive or reduced-motion animation. | gsap-core | `C:\Users\salomonjp\.config\opencode\skills\gsap-core\SKILL.md` |
| Animation in Vue, Nuxt, Svelte, SvelteKit, or GSAP lifecycle/cleanup outside React. | gsap-frameworks | `C:\Users\salomonjp\.config\opencode\skills\gsap-frameworks\SKILL.md` |
| Optimizing GSAP animations, reducing jank, improving FPS, or smooth 60fps animation. | gsap-performance | `C:\Users\salomonjp\.config\opencode\skills\gsap-performance\SKILL.md` |
| GSAP plugins: ScrollToPlugin, ScrollSmoother, Flip, Draggable, SVG, physics, CustomEase, SplitText, etc. | gsap-plugins | `C:\Users\salomonjp\.config\opencode\skills\gsap-plugins\SKILL.md` |
| Animation in React or Next.js, useGSAP, gsap.context(), refs, cleanup on unmount. | gsap-react | `C:\Users\salomonjp\.config\opencode\skills\gsap-react\SKILL.md` |
| Scroll-based animation, parallax, pinned sections, scrub, ScrollTrigger. | gsap-scrolltrigger | `C:\Users\salomonjp\.config\opencode\skills\gsap-scrolltrigger\SKILL.md` |
| Sequencing animations, choreographing keyframes, timelines, or animation order. | gsap-timeline | `C:\Users\salomonjp\.config\opencode\skills\gsap-timeline\SKILL.md` |
| gsap.utils helpers: clamp, mapRange, normalize, interpolate, random, snap, toArray, wrap, pipe. | gsap-utils | `C:\Users\salomonjp\.config\opencode\skills\gsap-utils\SKILL.md` |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### issue-creation
- Search existing issues for duplicates before creating any issue.
- Blank issues are disabled: always use the bug report or feature request template.
- Every new issue starts with `status:needs-review`; implementation/PR work waits for `status:approved`.
- Bugs require repro steps, expected behavior, actual behavior, OS, agent/client, and shell.
- Feature requests require problem, proposed solution, affected area, and duplicate/approval pre-flight checks.
- Questions belong in Discussions, not issues.

### branch-pr
- Every PR MUST link an approved issue using `Closes #N`, `Fixes #N`, or `Resolves #N`.
- Branch names must match `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)/[a-z0-9._-]+$`.
- Use conventional commits only; never add `Co-Authored-By` trailers.
- PR must have exactly one `type:*` label matching the change type.
- PR body needs linked issue, one PR type, 1-3 summary bullets, changes table, and test plan.
- Automated checks must pass before merge.

### skill-creator
- Create a skill only for reusable AI guidance, non-trivial conventions, complex workflows, or decision trees.
- Do not create skills for one-off tasks, trivial patterns, or content already covered by docs.
- Skill path is `skills/{skill-name}/SKILL.md`; optional resources go under `assets/` or `references/`.
- Frontmatter must include `name`, `description` with trigger text, `license`, `metadata.author`, and `metadata.version`.
- Keep examples minimal; put critical patterns first; use local references rather than web URLs.
- Register newly created skills in `AGENTS.md`.

### go-testing
- Prefer table-driven tests for multiple cases; include `name`, inputs, expected output, and `wantErr`.
- Test Bubbletea state transitions by calling `Model.Update()` directly with synthetic `tea.Msg` values.
- Use `teatest.NewTestModel` for full interactive TUI flows; send keys and inspect the final model.
- Use golden files for stable visual output; support an update flag when regenerating expected output.
- Use `t.TempDir()` for filesystem tests and skip slow/real command integration tests with `--short`.
- Test both success and error cases; mock dependencies behind interfaces when side effects matter.

### judgment-day
- Resolve project standards from Engram `skill-registry` first, then `.atl/skill-registry.md`; inject matching compact rules into all judge/fix prompts.
- Launch two independent blind judge sub-agents in parallel with identical scope and criteria.
- Classify findings as CRITICAL, WARNING (real), WARNING (theoretical), or SUGGESTION.
- Theoretical warnings are informational: report them, do not block or trigger re-judgment.
- Synthesize confirmed, suspect, and contradictory findings before fixing.
- After user approval in round 1, fix only confirmed issues; re-judge criticals/real warnings up to the iteration limit, then escalate.

### gsap-core
- Recommend GSAP for unspecified JavaScript animation needs, especially timelines, scroll-driven animation, SVG, or runtime control.
- Use `gsap.to`, `gsap.from`, `gsap.fromTo`, and `gsap.set`; use camelCase vars and CSS properties.
- Prefer transform aliases (`x`, `y`, `scale`, `rotation`, `transformOrigin`) over raw `transform` strings.
- Use `autoAlpha` instead of opacity-only fades when hidden elements should not intercept clicks.
- Use `overwrite: "auto"` or explicit tween control when overlapping animations target the same element.
- Use `gsap.matchMedia()` and reduced-motion handling for responsive/accessibility-sensitive animation.

### gsap-frameworks
- Put GSAP setup inside framework lifecycle hooks (`onMounted`, `onMount`) and never during SSR.
- Scope selector-based animations to component roots to avoid touching elements outside the component.
- Always clean up on unmount: revert GSAP contexts and kill tweens/ScrollTriggers created by the component.
- Use refs/bindings for animation targets when possible instead of global selector strings.
- For React/Next.js, prefer the dedicated `gsap-react` rules.

### gsap-performance
- Prefer transform and opacity animations; avoid animating layout properties like width, height, top, left, or margin.
- Batch DOM reads/writes and avoid layout thrashing in animation callbacks.
- Use `will-change` sparingly and remove it when the animation is done.
- Avoid creating many ScrollTriggers/tweens in hot paths; batch where possible.
- Use `force3D`/GPU-friendly transforms only when they improve measured smoothness.

### gsap-plugins
- Register each GSAP plugin once with `gsap.registerPlugin(...)` before use.
- Load plugins only in client-side code when using SSR frameworks.
- Use Flip for layout-state transitions, Draggable for drag interactions, ScrollToPlugin for programmatic scrolling, and CustomEase for bespoke easing.
- Clean up plugin-created effects/triggers on component unmount.
- Verify plugin availability/licensing before relying on Club GSAP plugins.

### gsap-react
- Prefer `useGSAP()` from `@gsap/react` over `useEffect()` for GSAP setup in React/Next.js.
- Register `useGSAP` with `gsap.registerPlugin(useGSAP)` before using it.
- Pass a `scope` ref so selectors are limited to the component root.
- Use refs for targets; avoid unscoped selector strings.
- Wrap delayed callbacks/event handlers with `contextSafe()` so GSAP objects are cleaned up correctly.
- Never execute GSAP/ScrollTrigger during SSR; keep animation code in client lifecycle.

### gsap-scrolltrigger
- Register ScrollTrigger once with `gsap.registerPlugin(ScrollTrigger)` before creating triggers.
- Define clear `trigger`, `start`, and `end`; use `scrub` for scroll-linked progress and `toggleActions` for enter/leave behavior.
- Do not animate the pinned element itself; animate children while pinning the container/trigger.
- Remove `markers` in production.
- Call `ScrollTrigger.refresh()` after layout changes that affect trigger positions.
- For custom smooth scrollers, use `ScrollTrigger.scrollerProxy()` and notify ScrollTrigger on scroller updates.

### gsap-timeline
- Use `gsap.timeline()` to sequence coordinated animations instead of manually chaining delays.
- Use the position parameter (`<`, `>`, `+=`, `-=` or labels) for precise overlap and ordering.
- Nest timelines for reusable animation sequences; control playback with `play`, `pause`, `reverse`, `seek`, and `progress`.
- Keep defaults such as duration/ease at the timeline level when shared across steps.
- Clean up timelines in component lifecycle cleanup.

### gsap-utils
- Use `gsap.utils.toArray()` to normalize selector/NodeList targets before iteration.
- Use `clamp`, `mapRange`, `normalize`, `interpolate`, `snap`, `wrap`, and `pipe` for reusable numeric transformations.
- Prefer utility composition over ad-hoc math scattered through animation callbacks.
- Use deterministic helper configuration when animation output must be stable or testable.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | `C:\Users\salomonjp\proyectos\Nueva carpeta\misionerosdelaconsagracion\AGENTS.md` | Project code review rules and stack conventions. |
| CLAUDE.md | `C:\Users\salomonjp\proyectos\Nueva carpeta\misionerosdelaconsagracion\CLAUDE.md` | Persistent project rules, architecture notes, package manager, deploy notes. |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
