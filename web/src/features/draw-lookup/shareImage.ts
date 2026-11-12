/**
 * Vẽ ảnh kết quả một kỳ quay bằng canvas trên máy người dùng (không upload). Dùng cho nút "Tải ảnh" / "Chia sẻ".
 */
export interface ShareImageContent {
  title: string;
  subtitle: string;
  /** Mỗi dòng: nhãn bên trái, giá trị bên phải */
  rows: [label: string, value: string, highlight?: boolean][];
  footer: string;
}

const WIDTH = 720;
const PAD = 36;
const ROW_H = 44;

export function drawShareImage(content: ShareImageContent): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const height = PAD * 2 + 96 + content.rows.length * ROW_H + 70;
  const scale = 2;
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(scale, scale);

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, WIDTH, 6);

  const font = (weight: number, size: number, mono = false) =>
    `${weight} ${size}px ${mono ? "'JetBrains Mono Variable', ui-monospace, monospace" : "'Plus Jakarta Sans Variable', system-ui, sans-serif"}`;

  ctx.fillStyle = '#f8fafc';
  ctx.font = font(800, 28);
  ctx.fillText(content.title, PAD, PAD + 30);
  ctx.fillStyle = '#94a3b8';
  ctx.font = font(500, 17);
  ctx.fillText(content.subtitle, PAD, PAD + 62);

  let y = PAD + 96;
  for (const [label, value, highlight] of content.rows) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(WIDTH - PAD, y);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = font(700, 16);
    ctx.fillText(label, PAD, y + 28);
    ctx.fillStyle = highlight ? '#ef4444' : '#f8fafc';
    ctx.font = font(800, highlight ? 22 : 18, true);
    ctx.textAlign = 'right';
    ctx.fillText(value, WIDTH - PAD, y + 29, WIDTH - PAD * 2 - 150);
    ctx.textAlign = 'left';
    y += ROW_H;
  }

  ctx.fillStyle = '#64748b';
  ctx.font = font(500, 13);
  ctx.fillText(content.footer, PAD, height - PAD - 10, WIDTH - PAD * 2);
  return canvas;
}

export const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
