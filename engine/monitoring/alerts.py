"""Kênh gửi cảnh báo vận hành: GitHub issue tự động và Telegram admin.

Secret chỉ đọc từ biến môi trường (GITHUB_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID),
không ghi vào log. Thông báo lỗi HTTP được che token trước khi in.

Chống spam: mỗi trạng thái sự cố có một fingerprint. Issue đang mở lưu fingerprint trong body;
chỉ bình luận và nhắn Telegram khi fingerprint đổi, và tự đóng issue khi dữ liệu trở lại bình thường.
"""

from __future__ import annotations

import html
import os
import re
from typing import Protocol

import requests
from loguru import logger

from engine.monitoring.health_check import HealthReport, product_label

ALERT_LABEL = "data-alert"
ALERT_TITLE = "Cảnh báo dữ liệu: crawler lỗi hoặc thiếu kỳ"
FINGERPRINT_RE = re.compile(r"<!-- data-alert-fingerprint: ([0-9a-f]+) -->")

def _redact(text: str, *secrets: str | None) -> str:
    for s in secrets:
        if s:
            text = text.replace(s, "***")
    return text

class GitHubChannel(Protocol):
    def find_open_alerts(self) -> list[dict]: ...
    def close_duplicate(self, number: int, keep: int) -> str: ...
    def open_alert(self, body: str) -> str: ...
    def update_alert(self, number: int, body: str, comment: str) -> str: ...
    def close_alert(self, number: int, comment: str) -> str: ...

class TelegramChannel(Protocol):
    def send(self, text: str) -> bool: ...

class GitHubIssues:
    def __init__(self, repo: str, token: str, run_url: str | None = None):
        self.repo = repo
        self._token = token
        self.run_url = run_url
        self._api = f"https://api.github.com/repos/{repo}"

    def _request(self, method: str, path: str, **kwargs) -> requests.Response:
        headers = {
            "Authorization": f"Bearer {self._token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        try:
            resp = requests.request(method, f"{self._api}{path}", headers=headers, timeout=20, **kwargs)
        except requests.RequestException as e:
            raise RuntimeError(_redact(f"GitHub API {method} {path}: {e}", self._token)) from None
        if resp.status_code >= 400:
            raise RuntimeError(_redact(f"GitHub API {method} {path} -> {resp.status_code}: {resp.text[:300]}", self._token))
        return resp

    def find_open_alerts(self) -> list[dict]:
        """Issue cảnh báo đang mở, cũ nhất trước."""
        params = {"labels": ALERT_LABEL, "state": "open", "per_page": 20, "sort": "created", "direction": "asc"}
        resp = self._request("GET", "/issues", params=params)
        return [i for i in resp.json() if "pull_request" not in i]

    def close_duplicate(self, number: int, keep: int) -> str:
        self._request("POST", f"/issues/{number}/comments", json={"body": f"Trùng với #{keep}, đóng tự động."})
        self._request("PATCH", f"/issues/{number}", json={"state": "closed", "state_reason": "not_planned"})
        return f"đóng issue trùng #{number}"

    def open_alert(self, body: str) -> str:
        self._ensure_label()
        issue = self._request("POST", "/issues", json={"title": ALERT_TITLE, "body": body, "labels": [ALERT_LABEL]}).json()
        return f"mở GitHub issue #{issue['number']}"

    def update_alert(self, number: int, body: str, comment: str) -> str:
        self._request("PATCH", f"/issues/{number}", json={"body": body})
        self._request("POST", f"/issues/{number}/comments", json={"body": comment})
        return f"cập nhật GitHub issue #{number}"

    def close_alert(self, number: int, comment: str) -> str:
        self._request("POST", f"/issues/{number}/comments", json={"body": comment})
        self._request("PATCH", f"/issues/{number}", json={"state": "closed", "state_reason": "completed"})
        return f"đóng GitHub issue #{number}"

    def _ensure_label(self) -> None:
        try:
            self._request("GET", f"/labels/{ALERT_LABEL}")
        except RuntimeError:
            self._request("POST", "/labels", json={
                "name": ALERT_LABEL, "color": "d93f0b",
                "description": "Cảnh báo tự động: crawler lỗi hoặc thiếu kỳ",
            })

class TelegramAdmin:
    def __init__(self, token: str, chat_id: str):
        self._token = token
        self._chat_id = chat_id

    def send(self, text: str) -> bool:
        url = f"https://api.telegram.org/bot{self._token}/sendMessage"
        payload = {"chat_id": self._chat_id, "text": text, "parse_mode": "HTML", "disable_web_page_preview": True}
        try:
            resp = requests.post(url, json=payload, timeout=15)
        except requests.RequestException as e:
            # Thông điệp lỗi của requests chứa URL có token
            logger.error(_redact(f"Không gửi được cảnh báo Telegram: {e}", self._token, self._chat_id))
            return False
        if resp.status_code != 200:
            logger.error(_redact(f"Telegram trả mã {resp.status_code}: {resp.text[:200]}", self._token, self._chat_id))
            return False
        return True

class DryRunGitHub:
    def __init__(self):
        self.calls: list[tuple[str, str]] = []

    def find_open_alerts(self) -> list[dict]:
        return []

    def close_duplicate(self, number: int, keep: int) -> str:
        self.calls.append(("duplicate", str(number)))
        return f"dry-run: sẽ đóng issue trùng #{number}"

    def open_alert(self, body: str) -> str:
        self.calls.append(("open", body))
        return "dry-run: sẽ mở GitHub issue"

    def update_alert(self, number: int, body: str, comment: str) -> str:
        self.calls.append(("update", comment))
        return f"dry-run: sẽ cập nhật GitHub issue #{number}"

    def close_alert(self, number: int, comment: str) -> str:
        self.calls.append(("close", comment))
        return f"dry-run: sẽ đóng GitHub issue #{number}"

class DryRunTelegram:
    def __init__(self):
        self.sent: list[str] = []

    def send(self, text: str) -> bool:
        self.sent.append(text)
        print("----- Telegram (dry-run) -----")
        print(text)
        return True

def build_channels(dry_run: bool = False) -> tuple[TelegramChannel | None, GitHubChannel | None]:
    if dry_run:
        return DryRunTelegram(), DryRunGitHub()

    telegram = None
    tg_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    tg_admin = os.environ.get("TELEGRAM_ADMIN_CHAT_ID")
    if tg_token and tg_admin:
        telegram = TelegramAdmin(tg_token, tg_admin)
    else:
        logger.info("Chưa cấu hình TELEGRAM_BOT_TOKEN/TELEGRAM_ADMIN_CHAT_ID: bỏ qua kênh Telegram admin.")

    github = None
    gh_token = os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPOSITORY")
    if gh_token and repo:
        run_url = None
        if os.environ.get("GITHUB_RUN_ID"):
            server = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
            run_url = f"{server}/{repo}/actions/runs/{os.environ['GITHUB_RUN_ID']}"
        github = GitHubIssues(repo, gh_token, run_url)
    else:
        logger.info("Không có GITHUB_TOKEN/GITHUB_REPOSITORY: bỏ qua kênh GitHub issue.")
    return telegram, github

def _issue_body(report: HealthReport, run_url: str | None) -> str:
    parts = [
        "Issue này do `engine/monitoring/health_check.py` tạo tự động sau lần chạy crawler.",
        "Issue tự đóng khi lần kiểm tra sau không còn sự cố.",
        "",
        report.to_markdown(),
    ]
    if run_url:
        parts += ["", f"Lần chạy: {run_url}"]
    parts += ["", f"<!-- data-alert-fingerprint: {report.fingerprint()} -->"]
    return "\n".join(parts)

def _telegram_text(report: HealthReport, issue_ref: str | None) -> str:
    title = "✅ <b>Dữ liệu đã bình thường trở lại</b>" if report.ok else "🚨 <b>Cảnh báo dữ liệu xổ số</b>"
    lines = [title, f"<i>{report.checked_at:%Y-%m-%d %H:%M} (giờ VN)</i>"]
    if report.simulated:
        lines.append(f"<i>Chạy thử: giả lập thiếu kỳ {html.escape(report.simulated)}</i>")
    for p in report.problems:
        lines.append(f"• <b>{html.escape(product_label(p.product))}</b> ({html.escape(p.kind)}): {html.escape(p.message)}")
    if issue_ref:
        lines.append(html.escape(issue_ref))
    return "\n".join(lines)

def dispatch_alerts(
    report: HealthReport,
    telegram: TelegramChannel | None,
    github: GitHubChannel | None,
) -> list[str]:
    """Mở/cập nhật/đóng issue và nhắn Telegram admin khi trạng thái sự cố thay đổi."""
    actions: list[str] = []
    run_url = getattr(github, "run_url", None)
    existing = None
    if github is not None:
        try:
            open_alerts = github.find_open_alerts()
        except RuntimeError as e:
            logger.error(f"Không đọc được issue cảnh báo: {e}")
            open_alerts = []
        if open_alerts:
            existing = open_alerts[0]
        # API danh sách issue có độ trễ nhất quán, hai lần chạy sát nhau có thể mở trùng
        for dup in open_alerts[1:]:
            try:
                actions.append(github.close_duplicate(dup["number"], existing["number"]))
            except RuntimeError as e:
                logger.error(f"Không đóng được issue trùng: {e}")

    notify = False
    issue_ref = None
    if report.ok:
        if existing is not None:
            try:
                actions.append(github.close_alert(existing["number"], report.to_markdown()))
                notify = True
                issue_ref = existing.get("html_url")
            except RuntimeError as e:
                logger.error(f"Không đóng được issue cảnh báo: {e}")
        if not actions:
            actions.append("không có sự cố, không gửi cảnh báo")
    else:
        fingerprint = report.fingerprint()
        body = _issue_body(report, run_url)
        if github is None:
            notify = True
        elif existing is None:
            try:
                actions.append(github.open_alert(body))
            except RuntimeError as e:
                logger.error(f"Không mở được issue cảnh báo: {e}")
            notify = True
        else:
            match = FINGERPRINT_RE.search(existing.get("body") or "")
            issue_ref = existing.get("html_url")
            if match and match.group(1) == fingerprint:
                actions.append(f"sự cố không đổi, giữ nguyên issue #{existing['number']}")
            else:
                try:
                    comment = report.to_markdown() + (f"\n\nLần chạy: {run_url}" if run_url else "")
                    actions.append(github.update_alert(existing["number"], body, comment))
                except RuntimeError as e:
                    logger.error(f"Không cập nhật được issue cảnh báo: {e}")
                notify = True

    if notify and telegram is not None:
        sent = telegram.send(_telegram_text(report, issue_ref))
        actions.append("đã nhắn Telegram admin" if sent else "nhắn Telegram admin thất bại")
    return actions
