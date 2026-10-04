# Script tự động chạy pipeline cục bộ trên Windows
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     VIETNAM LOTTERY & VIETLOTT - LOCAL RUNNER PIPELINE  " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$env:Path = "C:\Users\thieu\.local\bin;$env:Path"
$env:PYTHONIOENCODING = "utf-8"

if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "Chưa tìm thấy uv. Đang cài đặt uv..." -ForegroundColor Yellow
    powershell -ExecutionPolicy ByPass -Command "irm https://astral.sh/uv/install.ps1 | iex"
}

Write-Host "Đang đồng bộ môi trường Python qua uv..." -ForegroundColor Green
uv sync

Write-Host "Đang thực thi pipeline cào dữ liệu và phân tích..." -ForegroundColor Green
uv run python scripts/run_pipeline.py

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Hoàn tất! Dữ liệu mới nhất đã được cập nhật thành công." -ForegroundColor Green
Write-Host "Để xem ứng dụng web, mở terminal khác và chạy: cd web; npm run dev" -ForegroundColor Yellow
