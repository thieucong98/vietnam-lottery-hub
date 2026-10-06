# Technical Journal: Diagnosing & Hardening GitHub Actions Scheduled Crawler Pipeline

- **Date:** 2026-10-06
- **Author:** Antigravity / Engineering Team
- **Scope:** CI/CD & Pipeline Resilience (Crawler, Scheduler, Live Polling & Data Sync)
- **Status:** Complete & Verified

---

### 1. Root Cause Diagnosis (`ak:debug` & `ak:fix`)

User symptom: *"Hình như job crawl dữ liệu theo schedule không chạy, ví dụ như hôm nay tôi không thấy cập nhật kết quả của các loại xổ số."*

A systematic inspection of GitHub Actions run history, API run logs, crawler code, and draw timestamps revealed 3 chained root causes:

1. **GitHub Actions Scheduler Dropping Clustered Crons:**
   - In `.github/workflows/daily-crawler.yml`, 4 separate static cron schedules were defined within 32 minutes (`11:33`, `11:42`, `11:52`, `12:05` UTC).
   - Per GitHub Actions documentation, when multiple scheduled events are clustered in the same hour, GitHub's internal scheduler frequently coalesces or drops queued events during peak hours. Only run `37456089392` was triggered (dispatched early at `11:23:34Z`), while all later crons (`11:42`, `11:52`, `12:05`) were completely dropped by GitHub!

2. **Premature Time Window Check in `xsmb.py`:**
   - In `engine/crawlers/xsmb.py`:
     ```python
     if now.time() < time(18, 28):
         target_date -= timedelta(days=1)
     ```
   - When run `37456089392` was dispatched at `11:23:34Z` (= `18:23:34` VN):
     `now.time() < time(18, 28)` evaluated to `True`. The crawler immediately subtracted 1 day, setting target date to `2026-10-05` (yesterday).
   - Because `2026-10-05` was already crawled, `delta_days` was 0. The crawler logged *"Dữ liệu XSMB đã là mới nhất"* and exited without attempting to fetch today or wait.

3. **Fast Exit without In-Job Golden Window Wait Loop:**
   - In `scripts/run_pipeline.py`:
     ```python
     if total_new == 0 and not force_run and has_summary:
         write_github_output("has_new_data", "false")
         return
     ```
   - At 18:23:34 VN, both XSMB (draw ends ~18:30) and Vietlott 6/55 (draw ends ~18:30-18:40) were still in progress.
   - The runner exited after only 39 seconds, setting `has_new_data = 'false'`.
   - Because GitHub Actions dropped subsequent schedules, no further runs took place tonight, leaving today (`2026-10-06`) un-crawled.

---

### 2. Architectural Solutions Implemented

#### 1. In-Job Live Polling Mode (`scripts/run_pipeline.py`)
- Inside the pipeline, if `total_new == 0` during the Golden Draw Window (`18:15` to `19:30` VN) and today's draw is still missing:
  - The runner **DOES NOT exit early**.
  - Instead, it enters **Live Polling Mode**, staying alive and polling source feeds every 40 seconds (up to 22 attempts $\approx$ 15 minutes).
  - As soon as the source sites publish the results (~18:31 for XSMB, ~18:35 for Vietlott), it captures the draws, breaks out of the loop, builds indexes, runs tests, and deploys immediately!
  - **Key Benefit:** Complete immunity to GitHub Actions scheduler delays or drops. A single runner handles the entire draw window.

#### 2. Enhanced Time Threshold (`engine/crawlers/xsmb.py`)
- Adjusted the draw threshold from `18:28` to `18:15` (when XSMB drawing begins).
- From `18:15` onwards, `target_date = now.date()`. If `fetch_date` returns `None` (draw in progress), it gracefully logs the status without failing or falsely claiming the data is up to date.

#### 3. Optimized Cron Schedules (`daily-crawler.yml`)
- Rescheduled to well-spaced intervals during the draw window:
  - `20 11 * * *` (18:20 VN): Early draw kickoff with Live Polling.
  - `35 11 * * *` (18:35 VN): Primary catch-all if 18:20 was delayed.
  - `50 11 * * *` (18:50 VN): Vietlott Jackpot consolidation & secondary feeds.
  - `15 12 * * *` (19:15 VN): Evening confirmation sweep.
  - `00 13 * * *` (20:00 VN): Night backup sweep.
  - `30 4 * * *` (11:30 VN): Noon backfill check.

---

### 3. Verification & Live Results
1. **Crawler Execution:**
   - Successfully crawled XSMB for `2026-10-06`: Special prize `12554` (Đề 54).
   - Successfully crawled Vietlott Power 6/55 for `2026-10-06` (Kỳ #01407): `[06, 07, 18, 20, 24, 27 | 01]`.
2. **Matrix & Index Generation:**
   - Full pipeline executed cleanly in 28 seconds:
     - `data/xsmb/xsmb.parquet`, `xsmb-2-digits.parquet`, `xsmb-sparse.parquet`
     - `data/vietlott/power655.parquet`
     - `web/public/data/xsmb_index.json` (7,575 draws)
     - `web/public/data/vietlott_655_index.json` (1,407 draws)
     - `web/public/data/summary.json`
     - `web/public/data/bac_nho.json`
     - `web/public/data/vietlott_full_draws.json` & `vietlott_cooccurrence.json`
     - `web/public/data/ml_insights.json`
     - `README.md` live results table
3. **Automated Tests:** `uv run pytest` passed 8/8 tests (100%).
4. **Frontend Bundle:** `npm run build` compiled cleanly in 10.07s.
5. **Visual Verification:** Chrome DevTools confirmed today's `2026-10-06` results are displayed live on XSMB and Power 6/55 boards.
