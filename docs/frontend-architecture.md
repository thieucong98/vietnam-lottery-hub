# Kiến trúc frontend (Phase 1)

Tài liệu cho người làm Phase 2-4: cấu trúc thư mục, bảng URL, cách tải dữ liệu theo màn hình, bộ component cơ bản và các lệnh kiểm tra. Stack giữ nguyên: React 18, Vite 6, SPA tĩnh trên GitHub Pages, không backend.

## 1. Cấu trúc thư mục `web/`

```
web/
├── build/                    # Mã chạy lúc build (Node), không vào bundle trình duyệt
│   ├── dataBundles.ts        # Plugin Vite sinh gói dữ liệu gọn theo màn hình (mục 3)
│   └── preloadFonts.ts       # Chèn <link rel="preload"> cho font chính
├── e2e/                      # Playwright smoke test (5 luồng chính, desktop + mobile)
├── public/data/              # JSON do engine Python xuất ra (nguồn dữ liệu duy nhất)
└── src/
    ├── main.tsx              # Điểm vào: HashRouter, font, CSS toàn cục, chuyển link cũ ?tab=
    ├── App.tsx               # Khung ứng dụng: Navbar, HeroBanner, trang, hộp thoại, footer
    ├── app/
    │   ├── routes.ts         # Bảng URL và các hàm tạo/đọc URL (mục 2)
    │   ├── navigation.ts     # Hook useAppNavigation: đổi trang, mở/đóng hộp thoại
    │   └── AppRoutes.tsx     # <PageRoutes> (trang) và <OverlayRoutes> (hộp thoại)
    ├── pages/                # Mỗi URL một trang, lazy-load; trang tự tải dữ liệu mình cần
    ├── features/             # Tính năng lớn, tách theo module
    │   ├── lookup/           # Hộp thoại tra cứu: đơn số, bộ số/vé bao, cặp số
    │   ├── vietlott/         # Power 6/55, Mega 6/45: chọn số nhanh, bộ số, cặp/bộ ba, lịch sử
    │   ├── ticket-filter/    # Bộ lọc vé Vietlott, thống kê nhiều số XSMB
    │   ├── keno-3d/          # Keno, Max 3D, Max 3D Pro
    │   └── xsmb/             # Dò vé XSMB, kho lịch sử kỳ quay
    ├── components/           # Component dùng chung còn lại (Navbar, LiveResultsBoard, ...)
    ├── layout/               # HeroBanner, AppFooter, CSS khung trang
    ├── ui/                   # Bộ component cơ bản (mục 4)
    ├── data/                 # Tải dữ liệu: api.ts, datasets.ts, useData.ts, xsmbDraws.ts
    ├── utils/                # Hàm thuần: lotteryUtils.ts, ticketCheck.ts (có unit test)
    └── types.ts              # Kiểu dữ liệu của các file JSON
```

### Quy ước một module tính năng

Mỗi thư mục trong `features/` theo cùng một mẫu, ví dụ `features/vietlott/`:

| File | Vai trò |
| --- | --- |
| `useVietlottHub.ts` | Hook chứa state và logic. Trả về một object `model`. Export kiểu props. |
| `VietlottProductHub.tsx` | Component chính: gọi hook, vẽ phần chung, chọn panel theo tab. |
| `QuickPickPanel.tsx`, `ComboBaoPanel.tsx`, ... | Mỗi tab con một panel, nhận `{ model }`. |

Logic tính toán không phụ thuộc React nên đặt trong `utils/` và viết test (`*.test.ts` cạnh file).

## 2. URL và điều hướng

Dùng `HashRouter` vì GitHub Pages không có rewrite cho SPA. Mọi đường dẫn tạo qua `app/routes.ts` (`paths.*`, `lookupPath`), không viết tay chuỗi URL trong component.

| URL | Màn hình |
| --- | --- |
| `/#/` | Trang chủ, kết quả XSMB mới nhất |
| `/#/xsmb/2026-11-11` | Kết quả XSMB một ngày (trong 365 kỳ gần nhất) |
| `/#/vietlott/655`, `/#/vietlott/645` | Power 6/55, Mega 6/45 (công cụ chọn số nhanh) |
| `/#/vietlott/655/bo-so?so=03-11-16-22-35-41` | Dò bộ số / vé bao, nạp sẵn bộ số |
| `/#/vietlott/655/cap-so`, `/#/vietlott/655/lich-su` | Cặp & bộ ba cùng xuất hiện, kho lịch sử |
| `/#/keno-3d`, `/#/keno-3d/max-3d`, `/#/keno-3d/max-3d-pro` | Keno, Max 3D, Max 3D Pro |
| `/#/nhiet`, `/#/gan` | Ma trận nhiệt, số lâu chưa về |
| `/#/phan-tich` | Phân tích minh bạch: tần suất có khoảng tin cậy, khoảng cách, tổng, chẵn/lẻ, kiểm định ngẫu nhiên |
| `/#/bac-nho` | Thống kê có điều kiện XSMB (luôn so với tần suất nền, có cỡ mẫu) |
| `/#/thuat-toan` | Phòng thí nghiệm xác suất: thuật toán so với 1.000 lần chọn ngẫu nhiên |
| `/#/loc-ve`, `/#/loc-ve/xsmb` | Bộ lọc vé Vietlott, thống kê nhiều số XSMB |
| `/#/so/68`, `/#/so/07?game=655` | Hộp thoại tra cứu một số (XSMB mặc định; `game=655` hoặc `645`) |
| `/#/tra-cuu/bo-so?game=645&so=03-11` | Hộp thoại tra cứu bộ số Vietlott |
| `/#/tra-cuu/cap?game=xsmb&so=68-86` | Hộp thoại tra cứu cặp số |
| `/#/phap-ly` | Hộp thoại tuyên bố pháp lý |

Link cũ dạng `?tab=heatmap` được chuyển sang URL mới trong `main.tsx`.

### Hộp thoại có URL

Các đường dẫn `/so/*`, `/tra-cuu*`, `/phap-ly` là hộp thoại phủ lên trang. Khi mở từ một trang, `useAppNavigation` lưu trang đó vào `location.state.backgroundLocation`, nên trang phía sau giữ nguyên và nút back đóng hộp thoại. Mở thẳng link hộp thoại thì phía sau là trang chủ. Thay đổi bên trong hộp thoại (đổi số, đổi trò chơi) dùng `replace`, không thêm lịch sử.

```ts
const nav = useAppNavigation();
nav.goTab('heatmap');                 // đổi trang
nav.openNumber('68');                 // /#/so/68
nav.openNumber('07', 'vietlott_655'); // /#/so/07?game=655
nav.openLookupText('68 86');          // tự chọn chế độ theo số lượng số nhập
nav.openLegal();
nav.closeOverlay();
```

### Thêm một màn hình mới

1. Tạo `src/pages/TenPage.tsx` (export default), tự tải dữ liệu bằng `useDataset`.
2. Khai báo `lazy(() => import('../pages/TenPage'))` và `<Route>` trong `app/AppRoutes.tsx`.
3. Nếu màn hình có mục trên thanh điều hướng: thêm vào `TabId` và `TAB_PATHS` trong `app/routes.ts`, và thêm nút trong `Navbar` / `MobileBottomNav`.
4. Thêm URL vào bảng trên và một kiểm tra trong `src/app/routes.test.ts`.

## 3. Tải dữ liệu theo màn hình

Lúc mở trang chủ chỉ tải `data/summary.json` (~9 KB) và `bundles/xsmb_draws_recent.json` (~5 KB): khoảng 14 KB, trước đây khoảng 2,2 MB. Dữ liệu khác tải khi vào màn hình cần nó, hoặc khi khối nằm dưới màn hình đầu cuộn tới (`useInView`), hoặc khi trình duyệt rảnh (`useIdle`).

### Gói sinh lúc build (`web/build/dataBundles.ts`)

Plugin Vite đọc JSON trong `public/data` và ghi vào `dist/bundles/`. Các file này không commit vì đổi mỗi ngày; dev server phục vụ cùng đường dẫn qua middleware. Engine Python và Telegram bot không đổi, vẫn dùng file gốc.

| Gói | Nguồn | Kích thước | Dùng ở |
| --- | --- | --- | --- |
| `xsmb_draws_recent.json` | 30 kỳ đầu của `xsmb_recent_draws.json`, dạng mảng | ~5 KB | Trang chủ |
| `xsmb_draws.json` | 365 kỳ, dạng mảng | ~54 KB (gzip ~24 KB) | Tab lịch sử XSMB, URL ngày cũ |
| `xsmb_stats.json`, `vietlott_655_stats.json`, `vietlott_645_stats.json` | `*_index.json` bỏ `recent_history`, `top_pairs`, `yearly_distribution` | 11-30 KB | Ma trận nhiệt, bảng số lâu chưa về, bộ lọc |
| `detail/<game>/<số>.json` | Một số trong `*_index.json` | ~3 KB | Hộp thoại tra cứu một số |
| `vietlott_655_draws.json`, `vietlott_645_draws.json` | Tách từ `vietlott_full_draws.json` | 86-107 KB | Dò bộ số, lịch sử Vietlott |

Định dạng XSMB nén: `{ fields: ['date', 'special', 'prize1', ...27 giải], draws: [['2026-11-11', 74129, 97579, ...]] }`. `data/xsmbDraws.ts` dựng lại loto, đầu, đuôi, thứ và đài quay giống `engine/analytics/index_builder.py` (có test so khớp).

Lưu ý khi chạy Docker với `docker-compose.yml`: thư mục `public/data` được mount lúc chạy, còn `bundles/` sinh lúc build image. Muốn gói theo kịp dữ liệu mới thì build lại image.

### Đọc dữ liệu trong component

```ts
import { useDataset, useJson } from '../data/useData';
import { numberDetailUrl } from '../data/datasets';

const summary = useDataset('summary');                 // { data, error, loading, retry }
const stats = useDataset('xsmbStats', inView);         // enabled = false để hoãn tải
const detail = useJson<NumberDetail>(numberDetailUrl('xsmb', '68'));
```

- Tên dataset khai báo một chỗ trong `data/datasets.ts` (URL, hàm giải nén, kiểu).
- Mỗi URL chỉ tải một lần mỗi phiên (`data/api.ts`); lỗi mạng không bị cache.
- Thêm dataset mới: thêm vào `DatasetMap` và `DATASETS`; nếu cần gói gọn hơn file gốc, thêm vào `buildDataBundles` và test trong `build/dataBundles.test.ts`.

Ngân sách kiểm tra trong CI bằng `scripts/check_size_budget.py --only bundle` (ngưỡng trong `size-budget.json`, xem `docs/data-quality.md`): dữ liệu lúc mở trang < 100 KB, mỗi gói < 150 KB, cùng giới hạn JS và CSS.

## 4. Bộ component cơ bản (`src/ui`)

Style bằng CSS Modules (`*.module.css`) dùng biến CSS có sẵn trong `index.css` (`--accent-gold`, `--text-muted`, `--radius-md`, ...). Không thêm framework CSS. Import từ `src/ui`:

```ts
import { Button, Card, Tabs, Ball, Table, Modal, Sheet } from '../ui';
```

### Button

| Prop | Kiểu | Mặc định | Ghi chú |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'gradient' \| 'secondary' \| 'ghost' \| 'gold' \| 'emerald' \| 'cyan' \| 'link'` | `'secondary'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Không áp dụng cho `link` |
| `icon` | `ReactNode` | | Đặt trước nhãn |
| `block`, `pill` | `boolean` | | Rộng 100%; bo tròn |

Nhận mọi thuộc tính của `<button>`; `type` mặc định là `"button"`.

```tsx
<Button variant="gradient" pill icon={<Search size={15} />} onClick={open}>Tra cứu</Button>
```

### Card

| Prop | Kiểu | Mặc định |
| --- | --- | --- |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` |
| `tone` | `'default' \| 'gold' \| 'red' \| 'inset'` | `'default'` |
| `title`, `icon`, `actions` | `ReactNode` | Hiện đầu thẻ khi có `title` hoặc `actions` |

### Tabs

```tsx
<Tabs<LookupMode>
  ariaLabel="Chế độ tra cứu"
  value={mode}
  onChange={setMode}
  panelId={panelId}                     // id của role="tabpanel" (tùy chọn, nên có)
  fill                                  // chia đều chiều ngang (tùy chọn)
  items={[{ id: 'single', label: 'Đơn số', icon: <Search size={15} /> }, ...]}
/>
<div role="tabpanel" id={panelId} aria-labelledby={tabId(panelId, mode)}>...</div>
```

Theo mẫu ARIA tabs: `role="tablist"` / `role="tab"` / `aria-selected` / `aria-controls`; chỉ tab đang chọn nằm trong thứ tự Tab, phím mũi tên trái/phải, Home, End chuyển và chọn tab.

### Ball

| Prop | Kiểu | Mặc định | Ghi chú |
| --- | --- | --- | --- |
| `value` | `number \| string` | | Số được chuẩn hóa 2 chữ số |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 24 / 28 / 40 / 56 / 72 px |
| `tone` | 3D: `gold`, `red`, `emerald`, `cyan`, `slate`, `jackpot2`; phẳng: `flat-muted`, `flat-dim`, `flat-gold`, `flat-special`, `flat-special-hit`, `flat-selected` | `'gold'` | Bóng 3D dùng class `.lottery-ball` có sẵn |
| `onClick`, `title` | | | Có `onClick` thì render `<button>` với `aria-label` |
| `children` | `ReactNode` | | Thay nội dung số (ví dụ icon) |

### Table

```tsx
<Table
  columns={[
    { key: 'date', header: 'Ngày quay', mono: true, render: (r) => r.date },
    { key: 'hits', header: 'Số lần', align: 'right', render: (r) => r.hits },
  ]}
  rows={rows}
  rowKey={(r) => r.date}
  emptyText="Không có dữ liệu."
  maxHeight={280}                        // cuộn dọc, tiêu đề cố định
  caption="Lịch sử xuất hiện"            // cho trình đọc màn hình
/>
```

### Modal

| Prop | Kiểu | Ghi chú |
| --- | --- | --- |
| `open`, `onClose` | `boolean`, `() => void` | Đóng bằng Esc, nút Đóng, bấm nền |
| `title`, `subtitle`, `icon` | `ReactNode` | `title` là nhãn của `role="dialog"` |
| `toolbar` | `ReactNode` | Thanh dưới tiêu đề, thường là `Tabs` |
| `size` | `'sm' \| 'md' \| 'lg'` | 520 / 720 / 960 px; dưới 640 px chiếm toàn màn hình |

Khi mở: khóa cuộn trang nền, đưa focus vào hộp thoại, giữ Tab / Shift+Tab trong hộp thoại, trả focus về phần tử đã mở nó khi đóng (`ui/useDialogBehavior.ts`). Khi có nhiều hộp thoại cùng mở, chỉ hộp thoại trên cùng nhận Esc và Tab (thứ tự theo `layer`: Modal 100, cổng 18+ 105, pháp lý 110); khóa cuộn chỉ gỡ khi hộp thoại cuối cùng đóng. Bấm nền chỉ đóng khi nhấn và thả chuột đều trên nền.

### Sheet

Bảng trượt từ đáy màn hình, dành cho menu và bộ lọc trên di động (chưa có màn hình nào dùng; menu "Thêm" của `MobileBottomNav` vẫn là bản riêng, chuyển sang `Sheet` ở Phase 2). Props: `open`, `onClose`, `title`, `subtitle`, `children`, `className`. Hành vi Esc / focus / khóa cuộn giống `Modal`.

### BarChart và ChartNote (Phase 4)

`BarChart`: cột quan sát, tùy chọn vạch `expected` (kỳ vọng nếu ngẫu nhiên) và `highlightIndex`. Có bảng ẩn cho trình đọc màn hình (`ariaLabel` làm caption).

`ChartNote`: chú thích bắt buộc dưới **mọi biểu đồ**: `sample` (cỡ mẫu, ví dụ "1.422 kỳ (01/08/2017 - 10/11/2026)") và `warning` (mặc định `DEFAULT_CHART_WARNING`). Biểu đồ mới phải có `ChartNote`.

```tsx
<BarChart ariaLabel="Phân bố tổng" labels={h.labels} observed={h.observed} expected={h.expected} />
<ChartNote sample={`${n} kỳ`} />
```

Diễn giải p-value bằng lời: `utils/statsText.ts` (`explainP`) và `features/analysis/Verdict.tsx`.

### useControllableState

`useControllableState(value, onChange, initial)`: state do cha điều khiển khi có `value` (ví dụ tab con đọc từ URL), tự giữ khi không có. Các hub dùng để nhận `tool` / `view` từ URL.

## 5. Chuyển dần inline style

Phase 1 đã chuyển khung ứng dụng (`App`, `layout/`) và hộp thoại tra cứu (`features/lookup/`, từ 234 xuống 16 khối `style={{...}}`, còn lại là style phụ thuộc dữ liệu như chiều cao cột biểu đồ). Các module khác vẫn còn inline style và cần chuyển tiếp ở Phase 2:

- Style tĩnh: chuyển sang `TenComponent.module.css` cạnh component, tên class mô tả thuộc tính (`rowCenterGap8`) hoặc vai trò (`header`, `statCard`).
- Style phụ thuộc dữ liệu (phần trăm, màu theo giá trị): giữ inline hoặc truyền qua biến CSS (`style={{ '--pct': ... }}`).
- Ưu tiên dùng `ui/` thay vì viết lại nút, thẻ, bảng.

## 6. Kiểm tra chất lượng

```bash
cd web
npm run lint                 # ESLint (TypeScript + react-hooks)
npm test                     # Vitest: utils, logic dò vé, URL, giải nén dữ liệu, bộ component
npm run build                # tsc (app + build/e2e) và vite build
python3 ../scripts/check_size_budget.py --only bundle   # Ngân sách dung lượng
npx playwright install --with-deps chromium
npm run test:e2e             # Smoke test trên bản build, desktop và mobile (Pixel 7)
```

5 luồng smoke test (`e2e/smoke.spec.ts`): trang chủ và dung lượng dữ liệu lúc mở; tra cứu một số qua URL và đóng bằng Esc; dò bộ số Vietlott qua URL; tạo vé ở bộ lọc; điều hướng bằng URL và nút back.

CI (`.github/workflows/compliance.yml`) chạy compliance lint, pytest, kiểm tra schema dữ liệu, ESLint, Vitest, build, ngân sách dung lượng, compliance lint trên bản build và Playwright cho mọi PR vào `main`.

Đo Lighthouse mobile (Performance) trên bản build cục bộ, Lighthouse 12.8, mô phỏng mạng di động: 93 (FCP 2,1 s, LCP 2,7 s, TBT 130-150 ms, CLS 0-0,06). Thay đổi chính để đạt: tải dữ liệu theo màn hình, tách mã theo route, font tự host có preload thay cho Google Fonts.

## 7. Nguyên tắc tuân thủ khi viết mã mới

Áp dụng cho mọi phase (chi tiết trong kế hoạch AUT-11 và `LEGAL_DISCLAIMER.md`):

- Chỉ thống kê mô tả dữ liệu lịch sử. Các từ bị cấm được `scripts/compliance_lint.py` chặn trong CI, kể cả trong comment.
- Tính năng chọn số ghi rõ không làm tăng xác suất trúng và hiển thị xác suất thật (Power 6/55 Jackpot 1: 1/28.989.675; Mega 6/45: 1/8.145.060).
- Không nút mua vé, liên kết đại lý, quảng cáo hay thu tiền.
- Không thu thập dữ liệu cá nhân; dữ liệu người dùng chỉ lưu `localStorage`. Font và dữ liệu đều tự host, ứng dụng không gọi dịch vụ bên thứ ba lúc chạy.
