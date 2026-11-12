import type { Plugin } from 'vite';

/**
 * Chèn <link rel="preload"> cho các file font chính vào index.html lúc build,
 * để chữ hiển thị ngay bằng font web thay vì đổi font sau khi tải (gây xê dịch bố cục).
 */
export function preloadFontsPlugin(patterns: RegExp[]): Plugin {
  return {
    name: 'vlh-preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        return Object.keys(ctx.bundle ?? {})
          .filter((file) => patterns.some((p) => p.test(file)))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `./${file}` },
            injectTo: 'head' as const,
          }));
      },
    },
  };
}
