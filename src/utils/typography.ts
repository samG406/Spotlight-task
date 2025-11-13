import type { FigmaTextStyle } from '../types/figma.js';

export function figmaTextStyleToCSS(style: FigmaTextStyle | undefined): Record<string, string> {
  if (!style) {
    return {};
  }

  const css: Record<string, string> = {};

  if (style.fontFamily) {
    css['font-family'] = `"${style.fontFamily}", sans-serif`;
  }

  if (style.fontSize) {
    css['font-size'] = `${style.fontSize}px`;
  }

  if (style.fontWeight) {
    css['font-weight'] = String(style.fontWeight);
  }

  if (style.italic) {
    css['font-style'] = 'italic';
  }

  if (style.textDecoration) {
    if (style.textDecoration === 'UNDERLINE') {
      css['text-decoration'] = 'underline';
    } else if (style.textDecoration === 'STRIKETHROUGH') {
      css['text-decoration'] = 'line-through';
    }
  }

  if (style.textCase) {
    switch (style.textCase) {
      case 'UPPER':
        css['text-transform'] = 'uppercase';
        break;
      case 'LOWER':
        css['text-transform'] = 'lowercase';
        break;
      case 'TITLE':
        css['text-transform'] = 'capitalize';
        break;
      case 'SMALL_CAPS':
      case 'SMALL_CAPS_FORCED':
        css['font-variant'] = 'small-caps';
        break;
    }
  }

  if (style.textAlignHorizontal) {
    css['text-align'] = style.textAlignHorizontal.toLowerCase();
  }

  if (style.fontSize && style.lineHeightPx) {
    const lineHeightRatio = style.lineHeightPx / style.fontSize;
    if (lineHeightRatio <= 1.5) {
      css['white-space'] = 'nowrap';
    }
  } else {
    css['white-space'] = 'nowrap';
  }

  if (style.letterSpacing) {
    if (style.letterSpacing.unit === 'PIXELS') {
      css['letter-spacing'] = `${style.letterSpacing.value}px`;
    } else if (style.letterSpacing.unit === 'PERCENT') {
      const fontSize = style.fontSize || 16;
      css['letter-spacing'] = `${(style.letterSpacing.value / 100) * fontSize}px`;
    }
  }

  if (style.lineHeightPx) {
    css['line-height'] = `${style.lineHeightPx}px`;
  } else if (style.lineHeightPercentFontSize) {
    css['line-height'] = `${style.lineHeightPercentFontSize}%`;
  } else if (style.lineHeightPercent) {
    css['line-height'] = `${style.lineHeightPercent}%`;
  }

  if (style.fills && style.fills.length > 0) {
    const fill = style.fills.find((f) => f.visible !== false) || style.fills[0];
    if (fill && fill.type === 'SOLID' && fill.color) {
      const opacity = (fill.opacity ?? 1) * (fill.color.a ?? 1);
      const r = Math.round(fill.color.r * 255);
      const g = Math.round(fill.color.g * 255);
      const b = Math.round(fill.color.b * 255);
      if (opacity === 1) {
        css['color'] = `rgb(${r}, ${g}, ${b})`;
      } else {
        css['color'] = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
    }
  }

  return css;
}
