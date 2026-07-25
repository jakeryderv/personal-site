# jakeryderv (Jake Van Slyke) — GitHub Skills/Interests Profile Research

Source: `gh api` skim of README + file tree (and `/languages`, `/repos` metadata for
dates) across 20 named repos, July 2026. "Thin" repos (stub README, no meaningful
tree) are flagged as such rather than guessed at.

## 1. Domains with evidence

**Robotics / simulation (currently the deepest, most sustained focus)**
- `jetbot` — coursework labs (lab2/lab3, Jupyter notebooks) getting a physical/simulated
  JetBot running — the entry point into the robotics track.
- `jetbot-isaac` — "JetBot lane-following in Isaac Sim + Isaac Lab": PPO CnnPolicy on
  procedural oval/circle/rounded-rect tracks, per-scene domain randomization (lighting,
  textures, camera pose, dynamics), targets a real RTX 5070 Ti (Blackwell) box, layered
  architecture (`core` pure-numpy → `usd` OpenUSD scaffolding → `sim` Isaac Sim/Omniverse
  Kit → `lab` Isaac Lab RL), CI badge, `make doctor` preflight, uv-locked deps.
- `jetbot-racer` — "Pure-vision JetBot tape-track racing," explicitly sim-first: build
  scene/label-extraction/data-gen/perception/controller/eval in Isaac Sim on a cloud GPU
  box (Dockerized, NVIDIA Container Toolkit) before transferring to real hardware; has a
  written design doc (`docs/jetbot-racing-plan-v2.md`), `just`-based task runner, 18 fast
  pytest tests, pre-commit/ruff.
- `synthpipe` — modular synthetic-data generation for 6DoF pose estimation: parametric
  mesh generation, photorealistic Blender rendering (HDRI, weather, camera effects, GPU
  rigid-body physics via Newton/Warp, NVIDIA SimReady materials), BOP metrics (ADD, VSD,
  MSSD…), COCO/YOLO/HuggingFace export. Packaged as `pip install synthpipe` — a real
  installable tool, not a one-off script.

**Computer vision (pipeline-building, iterated over time)**
- `cvlab` (earliest, thin README: "CV pipeline framework — independent nodes glued by a
  platform") → `depth-detection` (real-time monocular depth benchmark comparing MiDaS /
  DepthAnythingV2 / RT-MonoDepth with a live HUD + web dashboard) → `vision-pipeline`
  (generalizes the same three depth models plus 47 total plugins across 11 categories —
  detection, filtering, measurement, scoring, annotation — behind a plugin-registration
  architecture with a Svelte/TS web dashboard and CLI). Visible progression from a single
  benchmark tool to a general composable framework.

**Reinforcement learning**
- `reinforcement-learning` — battery-arbitrage RL (custom `battery.py` env, training
  curves, Q-value heatmaps) and an inventory-management RL project with a Flask app and
  a pytest suite (algorithms/environment/API tests).
- `rl-gridworld` — an interactive, in-browser RL teaching tool (Q-learning, Monte Carlo,
  cliff-walking comparisons, bootstrap comparisons) built in TypeScript; notably built
  using an AI-assisted plan/spec workflow.

**ML fundamentals / applied data science**
- `machine-learning-2` — coursework notebooks: naive Bayes, a student-academics-performance
  project with a written reflection.
- `imdb-sentiment-classification` — thin/stub (README literally says "fill in later"),
  but has a real notebook + writeup + a chain-rule PDF (backprop derivation), suggesting
  a from-scratch NN exercise rather than a library call.
- `nba-predictions` — full pipeline: NBA API data collector, feature engineering (rolling
  averages, team-strength metrics), multiple models (Random Forest, Gradient Boosting,
  Logistic Regression), config management, notebooks for team/player analysis.
- `big-data-project` — the most substantial data-engineering artifact: broadband/
  demographics analysis on Databricks (`databricks.yml`, GitHub Actions CI/CD to deploy),
  k-means + GMM clustering, tier classifiers with confusion matrices/feature importance,
  county/tract-level choropleth maps, a full final report (md + PDF).

**LLM / agent tooling (newest, and arguably most technically ambitious)**
- `unified-llm` — single interface over cloud (OpenAI/Anthropic/Gemini via LiteLLM) and
  local (Ollama, HF Transformers, vLLM/LM Studio/llama.cpp) providers; optimization
  presets (4/8-bit quantization, LoRA/QLoRA, Flash Attention); a benchmarking harness on
  top of `lm-evaluation-harness` (MMLU, HumanEval, GSM8K, HellaSwag) and a latency/
  throughput profiler (p50/p95/p99).
- `llm-extend` — smaller: a middleware/history extension layer around an LLM core, tested
  (`tests/test_middleware.py`, `test_core.py`).
- `tau` — a custom coding agent built on top of another engine's primitives: owns its own
  protocol, tool layer, sessions, persistence, and context management. Sandboxed command
  execution via `bubblewrap` (read-only host, hidden credentials, no network by default,
  explicit escape hatches), named/resumable sessions with revision-ordered durable
  events, a TUI with streaming/cost tracking, and a versioned/frozen v1 protocol that has
  "passed its field-acceptance gate." Created this week (2026-07-13) — clearly the
  current frontier of what they're building.

**Systems / low-level**
- `crack` — the earliest repo (2024-06): a multithreaded password cracker in C++ using
  Crypto++ (SHA-256, MD5, BLAKE2, Whirlpool), a hand-rolled thread pool with manually
  load-balanced character-range partitioning across workers (`condition_variable`,
  `atomic`, `mutex`) — real understanding of concurrency primitives, not a library
  wrapper.
- `ttytype` — a terminal typing-game CLI (Python, `cli.py`/`game.py`/`stats.py`, tested).
- `learn-vim` — a hard-fork of an existing "learn-vim" tutorial repo, modernized for
  Neovim/Lua text-object grammar; content contribution unclear from a skim (thin README).
- `kvproj` — a key-value store with a defined interface; README is a one-line stub, repo
  is essentially empty (just a Makefile + README) — flagged as unclear/early-stage, not
  weighted in the profile.

## 2. Languages / tools (frequency-weighted, from `/languages` across all 20 repos)

- **Python** — overwhelming majority language: `jetbot-isaac`, `jetbot-racer`,
  `vision-pipeline`, `cvlab`, `depth-detection`, `reinforcement-learning`, `synthpipe`,
  `unified-llm`, `llm-extend`, `ttytype`, `big-data-project`, `nba-predictions`, plus
  Jupyter Notebook–only repos (`jetbot`, `machine-learning-2`, `imdb-sentiment-classification`).
- **TypeScript / JavaScript** — `vision-pipeline` and `cvlab` dashboards, `rl-gridworld`
  (full app), `tau` (TUI/CLI), `learn-vim` (JS alongside Vim Script).
- **C++** — `crack` only, but substantive (Crypto++, STL threading primitives).
- **Svelte** — `vision-pipeline` dashboard.
- **Vim Script** — `learn-vim`.
- **Build/tooling, very consistent across the 2026 repos**: `uv` as the Python
  package/venv manager in nearly every recent repo; `Makefile` and/or `just` as task
  runners (`jetbot-isaac`, `jetbot-racer`, `big-data-project`, `llm-extend`); `ruff` +
  `pre-commit`; `pytest`; Docker + NVIDIA Container Toolkit (`jetbot-racer`); GitHub
  Actions CI (`jetbot-isaac` badge, `big-data-project` deploy workflow).
- **ML/robotics libraries evidenced by name**: PyTorch/HF Transformers (depth models,
  `unified-llm`), NVIDIA Isaac Sim / Isaac Lab / Omniverse Kit, OpenUSD (`pxr`),
  Gymnasium (`gym.register`), Stable-Baselines-style PPO, OpenCV (Canny/Harris/contours/
  Hough in `vision-pipeline`), MediaPipe (pose estimation), Blender `bpy` + Newton/Warp
  GPU physics (`synthpipe`), scikit-learn (RF/GBM/LogReg in `nba-predictions`), LiteLLM
  and `lm-evaluation-harness` (`unified-llm`), Crypto++ (`crack`), `bubblewrap` sandboxing
  (`tau`), Databricks Asset Bundles (`big-data-project`).
- No Lua or CUDA-as-a-named-language observed directly in the language breakdowns
  (Lua config exists inside `learn-vim` content but isn't large enough to register);
  Postgres/SQL not evidenced in this repo set.

## 3. Standout projects not yet on the portfolio

- **`jetbot-isaac` / `jetbot-racer`** — sim-first robotics RL on NVIDIA's Isaac Sim/Isaac
  Lab stack, with a real hardware target (RTX 5070 Ti Blackwell laptop GPU), clean layered
  architecture (pure-python core → USD scaffolding → Isaac Sim → Isaac Lab RL), and
  production habits (CI, `make doctor` preflight, uv-locked deps, Dockerized cloud
  training). This is the most technically current and best-engineered robotics work and
  isn't represented on the portfolio at all.
- **`tau`** — a self-built coding agent (own protocol, sandboxed exec via bubblewrap,
  durable sessions, TUI with cost/token tracking, versioned v1 protocol that passed a
  "field-acceptance gate"). Built this week. Strong signal that they build AI-dev
  infrastructure rather than only consume it — a differentiated, timely story.
- **`synthpipe`** — a packaged (`pip install synthpipe`), genuinely reusable synthetic-
  data pipeline for 6DoF pose estimation (Blender rendering, BOP evaluation, COCO/YOLO
  export). Shows productization instinct beyond a single course project.
- (Honorable mention) **`crack`** — the oldest repo (2024), a hand-rolled multithreaded
  password cracker with a custom thread pool and multiple hash algorithms via Crypto++;
  useful as evidence of CS fundamentals predating the ML/robotics pivot, if the bio wants
  a "roots" data point.

## 4. Narrative (evidence-grounded)

Jake's GitHub history traces a clear arc: he started in 2024 with low-level C++ systems
work (a multithreaded password cracker built on a hand-rolled thread pool and the
Crypto++ library), picked up applied ML with a sports-prediction project in mid-2025, and
then, through a dense burst of activity across 2026, moved from classroom RL/ML
assignments (gridworld Q-learning, naive Bayes, sentiment analysis) into increasingly
ambitious computer-vision and robotics-simulation work. The CV work shows visible
iteration rather than one-offs — a single-purpose depth-estimation benchmark
(`depth-detection`) was generalized into a 47-plugin composable pipeline framework
(`vision-pipeline`) with its own dashboard, and a synthetic-data pipeline for pose
estimation (`synthpipe`) was packaged for reuse rather than left as a script. His most
sustained current focus is NVIDIA's Isaac Sim/Isaac Lab stack — training a JetBot to
lane-follow and tape-track-race entirely in simulation before a planned transfer to real
hardware — engineered with production habits (uv-locked dependencies, CI, Docker,
preflight checks) instead of notebook throwaways. He's also building his own LLM/agent
infrastructure: a unified multi-provider LLM interface with a benchmarking and
quantization harness, and, just this week, a from-scratch coding agent (`tau`) with
sandboxed command execution, durable sessions, and a TUI — suggesting someone who treats
AI-agent tooling as something to build, not just use. Across nearly every 2026 repo he
standardizes on Python plus `uv`, reaching for TypeScript/Svelte specifically when a
dashboard or visualization is called for, painting a picture of an applied ML/robotics
engineer who is equally comfortable shipping the tooling and infrastructure around his
own research.
