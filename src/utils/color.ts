import type { FigmaFill, FigmaStroke } from '../types/figma.js';

export function figmaColorToCSS(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a !== undefined ? color.a : 1;

  if (a === 1) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function figmaFillToCSS(fills: FigmaFill[] | undefined): string {
  if (!fills || fills.length === 0) {
    return 'transparent';
  }

  const fill = fills.find((f) => f.visible !== false) || fills[0];
  if (!fill) {
    return 'transparent';
  }

  const opacity = fill.opacity !== undefined ? fill.opacity : 1;

  switch (fill.type) {
    case 'SOLID':
      if (fill.color) {
        const color = { ...fill.color, a: (fill.color.a ?? 1) * opacity };
        return figmaColorToCSS(color);
      }
      return 'transparent';

    case 'GRADIENT_LINEAR':
    case 'GRADIENT_RADIAL':
    case 'GRADIENT_ANGULAR':
    case 'GRADIENT_DIAMOND':
      return figmaGradientToCSS(fill, opacity);

    case 'IMAGE':
      return 'transparent';

    default:
      return 'transparent';
  }
}

function figmaGradientToCSS(fill: FigmaFill, opacity: number): string {
  if (!fill.gradientStops || fill.gradientStops.length === 0) {
    return 'transparent';
  }

  const stops = fill.gradientStops
    .map((stop) => {
      const color = figmaColorToCSS({
        ...stop.color,
        a: (stop.color.a ?? 1) * opacity,
      });
      const position = Math.round(stop.position * 100);
      return `${color} ${position}%`;
    })
    .join(', ');

  switch (fill.type) {
    case 'GRADIENT_LINEAR': {
      let angle = '180deg';
      if (fill.gradientHandlePositions && fill.gradientHandlePositions.length >= 2) {
        const start = fill.gradientHandlePositions[0]!;
        const end = fill.gradientHandlePositions[1]!;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        angle = `${Math.round(Math.atan2(dy, dx) * (180 / Math.PI)) + 90}deg`;
      }
      return `linear-gradient(${angle}, ${stops})`;
    }

    case 'GRADIENT_RADIAL':
      return `radial-gradient(circle, ${stops})`;

    case 'GRADIENT_ANGULAR':
      return `conic-gradient(${stops})`;

    case 'GRADIENT_DIAMOND':
      return `radial-gradient(ellipse, ${stops})`;

    default:
      return 'transparent';
  }
}

export function figmaStrokeToCSS(strokes: FigmaStroke[] | undefined, strokeWeight?: number, strokeAlign?: string): string {
  if (!strokes || strokes.length === 0 || !strokeWeight || strokeWeight === 0) {
    return 'none';
  }

  const stroke = strokes.find((s) => s.visible !== false) || strokes[0];
  if (!stroke || !stroke.color) {
    return 'none';
  }

  const color = figmaColorToCSS({
    ...stroke.color,
    a: (stroke.color.a ?? 1) * (stroke.opacity ?? 1),
  });

  return `${strokeWeight}px solid ${color}`;
}

export function getBorderRadius(cornerRadius?: number, absoluteBoundingBox?: { width: number; height: number }): string {
  if (cornerRadius === undefined || cornerRadius === 0) {
    return '0';
  }
  return `${cornerRadius}px`;
}
