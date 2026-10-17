import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { ogTokens as t } from '../lib/og-tokens';

export interface OgImageProps {
  title: string;
  author: string;
  category?: string;
  date?: string;
  image?: { url: string };
  variant?: 'social' | 'thumbnail';
}

const width = 1200;
const imageColumn = 352;
const publicRoot = resolve('public');
const fontsRoot = resolve('src/assets/fonts');
const fonts = Promise.all(
  [
    ['MonaSans-Regular.ttf', 'Mona Sans', 400],
    ['MonaSans-SemiBold.ttf', 'Mona Sans', 600],
    // Satori's font registry accepts hundred-step weights; this face contains
    // Primer's actual 450-weight Japanese outlines for normal body text.
    ['NotoSansJP-450.woff', 'Noto Sans JP', 400],
    ['NotoSansJP-600.woff', 'Noto Sans JP', 600],
  ].map(async ([file, name, weight]) => ({
    name: String(name),
    data: await readFile(resolve(fontsRoot, String(file))),
    weight: Number(weight) as 400 | 600,
    style: 'normal' as const,
  }))
);
const avatar = readFile(resolve(publicRoot, 'favicon.ico')).then(
  (buffer) => `data:image/jpeg;base64,${buffer.toString('base64')}`
);

// Keep Japanese words and closing punctuation together, including short
// auxiliaries such as 読ん + だ. Oversized individual words can still wrap.
function titleSegments(title: string) {
  const chunks: string[] = [];
  for (const { segment } of new Intl.Segmenter('ja', {
    granularity: 'word',
  }).segment(title)) {
    const previous = chunks.length - 1;
    if (
      previous >= 0 &&
      (/^[\s、。）」』】!?.,:]+$/.test(segment) ||
        /^[ぁ-ゖ]{1,2}$/.test(segment) ||
        /[「『（【]$/.test(chunks[previous]))
    ) {
      chunks[previous] += segment;
    } else chunks.push(segment);
  }
  return chunks;
}

async function readEditorialImage(image?: { url: string }) {
  if (!image) return undefined;
  try {
    const url = new URL(image.url);
    const parts = url.pathname.split('/').slice(-2).map(decodeURIComponent);
    const localPath = resolve(publicRoot, 'notion', ...parts);
    if (!localPath.startsWith(`${publicRoot}${sep}notion${sep}`))
      return undefined;
    let buffer: Buffer;
    try {
      buffer = await readFile(localPath);
    } catch {
      if (url.protocol !== 'https:') return undefined;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return undefined;
      buffer = Buffer.from(await response.arrayBuffer());
    }
    const normalized = await sharp(buffer)
      .rotate()
      .resize({
        width: imageColumn,
        height: 416,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
    return `data:image/png;base64,${normalized.toString('base64')}`;
  } catch {
    console.warn('OGP image unavailable; using the title layout.');
    return undefined;
  }
}

export async function getOgImage(props: OgImageProps) {
  const thumbnail = props.variant === 'thumbnail';
  const height = thumbnail ? 675 : 630;
  const [fontData, avatarSrc, imageSrc] = await Promise.all([
    fonts,
    avatar,
    readEditorialImage(thumbnail ? undefined : props.image),
  ]);
  const metaHeight = thumbnail
    ? t.text(600) * 1.5 + t.space[32] + t.borderWidth
    : t.text(400) * 1.5;
  const footerHeight = thumbnail
    ? 0
    : t.space[48] + t.space[24] + t.borderWidth + t.space[32];
  const contentHeight = height - t.space[64] * 2 - footerHeight;
  const titleMaxHeight = contentHeight - metaHeight - t.space[32];
  const render = async (size: number, cover?: string) => {
    let titleHeight = 0;
    const titleWidth = cover
      ? width - t.space[64] * 3 - imageColumn
      : width - t.space[64] * 2;
    const measure = async (chunks: string[]) => {
      const lengths: number[] = [];
      await satori(
        <div
          style={{
            display: 'flex',
            ...t.heading(size),
            fontFamily: 'Mona Sans, Noto Sans JP',
          }}
        >
          {chunks.map((chunk, index) => (
            <span key={index} id={`measure-${index}`} style={{ flexShrink: 0 }}>
              {chunk}
            </span>
          ))}
        </div>,
        {
          width: 100000,
          height: 1000,
          fonts: fontData,
          embedFont: false,
          onNodeDetected: (node) => {
            const match = /^measure-(\d+)$/.exec(String(node.props.id || ''));
            if (match) lengths[Number(match[1])] = node.width;
          },
        }
      );
      return lengths;
    };
    let chunks = titleSegments(props.title);
    let lengths = await measure(chunks);
    if (lengths.some((length) => length > titleWidth - t.space[8])) {
      chunks = chunks.flatMap((chunk, index) =>
        lengths[index] > titleWidth - t.space[8]
          ? Array.from(
              new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(
                chunk
              ),
              (part) => part.segment
            )
          : [chunk]
      );
      lengths = await measure(chunks);
    }
    const lines = [''];
    let lineWidth = 0;
    chunks.forEach((chunk, index) => {
      if (lineWidth && lineWidth + lengths[index] > titleWidth - t.space[8]) {
        lines.push('');
        lineWidth = 0;
      }
      lines[lines.length - 1] += chunk;
      lineWidth += lengths[index];
    });
    const meta = (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: t.space[24],
          height: metaHeight,
          ...(thumbnail
            ? {
                justifyContent: 'space-between',
                paddingBottom: t.space[32],
                borderBottom: `${t.borderWidth}px solid ${t.color.border}`,
              }
            : {}),
          fontSize: t.text(thumbnail ? 600 : 400),
          fontWeight: t.semiboldWeight,
        }}
      >
        {props.category && <span>{props.category}</span>}
        {props.date && (
          <span
            style={{
              color: t.color.muted,
              fontSize: t.text(thumbnail ? 600 : 300),
              fontWeight: t.normalWeight,
            }}
          >
            {props.date}
          </span>
        )}
      </div>
    );
    const title = (
      <div
        id="og-title"
        style={{
          ...t.heading(size),
          width: '100%',
          whiteSpace: 'pre',
          fontFamily: 'Mona Sans, Noto Sans JP',
        }}
      >
        {lines.join('\n')}
      </div>
    );
    const svg = await satori(
      <div
        style={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          padding: t.space[64],
          gap: t.space[32],
          backgroundColor: t.color.canvas,
          color: t.color.text,
          fontFamily: 'Mona Sans, Noto Sans JP',
        }}
      >
        {cover ? (
          <div
            style={{ display: 'flex', gap: t.space[64], height: contentHeight }}
          >
            <div
              style={{
                width: width - t.space[64] * 3 - imageColumn,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: t.space[32],
              }}
            >
              {meta}
              {title}
            </div>
            <div
              style={{
                display: 'flex',
                width: imageColumn,
                height: contentHeight,
                padding: t.space[16],
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: t.radius,
                backgroundColor: t.color.subtle,
              }}
            >
              <img
                src={cover}
                alt=""
                width={imageColumn - t.space[16] * 2}
                height={contentHeight - t.space[16] * 2}
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: contentHeight,
              gap: t.space[32],
            }}
          >
            {meta}
            <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
              {title}
            </div>
          </div>
        )}
        {!thumbnail && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: t.space[24],
              borderTop: `${t.borderWidth}px solid ${t.color.border}`,
              fontSize: t.text(400),
              fontWeight: t.semiboldWeight,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: t.space[16],
              }}
            >
              <img
                src={avatarSrc}
                alt=""
                width={t.space[48]}
                height={t.space[48]}
                style={{ borderRadius: '50%' }}
              />
              <span>{props.author}</span>
            </div>
            <span style={{ color: t.color.muted }}>Blog</span>
          </div>
        )}
      </div>,
      {
        width,
        height,
        fonts: fontData,
        onNodeDetected: (node) => {
          if (node.props.id === 'og-title') titleHeight = node.height;
        },
      }
    );
    return { svg, fits: titleHeight <= titleMaxHeight };
  };
  // Use the official wide Heading scale. Measure the actual font layout instead
  // of estimating from character counts, and keep the full title in the image.
  for (const cover of imageSrc ? [imageSrc, undefined] : [undefined]) {
    for (const size of cover
      ? [700, 600, 500, 400]
      : thumbnail
        ? [900, 800, 700, 600, 500, 400]
        : [800, 700, 600, 500, 400]) {
      const result = await render(size, cover);
      if (result.fits) return sharp(Buffer.from(result.svg)).png().toBuffer();
    }
  }
  throw new Error(
    'Article title exceeds the OGP canvas at the smallest Primer heading size.'
  );
}
