import type { FigmaNode } from '../types/figma.js';

export function figmaLayoutToCSS(
  node: FigmaNode, 
  parentBoundingBox?: { x: number; y: number },
  isParentFlex?: boolean
): Record<string, string> {
  const nodeName = node.name || node.type;
  console.log(`\n=== LAYOUT: ${nodeName} ===`);
  
  if (node.absoluteBoundingBox) {
    console.log(`  BoundingBox: x=${node.absoluteBoundingBox.x}, y=${node.absoluteBoundingBox.y}, w=${node.absoluteBoundingBox.width}, h=${node.absoluteBoundingBox.height}`);
  }
  
  if (parentBoundingBox) {
    console.log(`  Parent: x=${parentBoundingBox.x}, y=${parentBoundingBox.y}`);
  }
  
  console.log(`  Parent is flex: ${isParentFlex}`);
  console.log(`  Has parent: ${!!parentBoundingBox}`);
  console.log(`  Node layoutMode: ${node.layoutMode || 'NONE'}`);
  
  if (node.layoutMode) {
    console.log(`  Layout Mode: ${node.layoutMode}, Gap: ${node.itemSpacing || 0}px`);
  }

  const css: Record<string, string> = {};

  if (node.layoutMode) {
    css['display'] = 'flex';
    css['flex-direction'] = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';

    if (node.layoutWrap === 'WRAP') {
      css['flex-wrap'] = 'wrap';
    } else if (node.layoutWrap === 'NO_WRAP') {
      css['flex-wrap'] = 'nowrap';
    }

    if (node.primaryAxisAlignItems) {
      css['justify-content'] = mapFigmaAlignment(node.primaryAxisAlignItems);
    }
    if (node.counterAxisAlignItems) {
      css['align-items'] = mapFigmaAlignment(node.counterAxisAlignItems);
    }

    if (node.itemSpacing !== undefined) {
      css['gap'] = `${node.itemSpacing}px`;
    }

    if (node.absoluteBoundingBox) {
      css['position'] = 'relative';
      
      const isVertical = node.layoutMode === 'VERTICAL';
      const widthSizingMode = isVertical ? node.counterAxisSizingMode : node.primaryAxisSizingMode;
      const heightSizingMode = isVertical ? node.primaryAxisSizingMode : node.counterAxisSizingMode;
      
      console.log(`  Width sizing: ${widthSizingMode || 'FIXED (default)'}, Height sizing: ${heightSizingMode || 'FIXED (default)'}`);
      
      if (widthSizingMode === 'AUTO') {
        css['width'] = 'auto';
      } else {
        css['width'] = `${node.absoluteBoundingBox.width}px`;
      }
      
      if (heightSizingMode === 'AUTO') {
        css['height'] = 'auto';
        css['min-height'] = 'auto';
      } else {
        if (node.absoluteBoundingBox.height > 0) {
          css['min-height'] = `${node.absoluteBoundingBox.height}px`;
        } else {
          css['min-height'] = 'auto';
        }
      }
      
      if (isParentFlex) {
      } else if (parentBoundingBox) {
        const offsetX = node.absoluteBoundingBox.x - parentBoundingBox.x;
        const offsetY = node.absoluteBoundingBox.y - parentBoundingBox.y;
        console.log(`Calculated offsets: left=${offsetX}px, top=${offsetY}px`);
        
        css['position'] = 'absolute';
        css['left'] = `${offsetX}px`;
        css['top'] = `${offsetY}px`;
        console.log(`  ✅ Applied absolute positioning: left=${offsetX}px, top=${offsetY}px`);
      } else {
        const left = Math.abs(node.absoluteBoundingBox.x) < 0.001 ? 0 : node.absoluteBoundingBox.x;
        const top = Math.abs(node.absoluteBoundingBox.y) < 0.001 ? 0 : node.absoluteBoundingBox.y;
        css['left'] = `${left}px`;
        css['top'] = `${top}px`;
        css['position'] = 'absolute';
        console.log(`  ✅ Applied absolute positioning: left=${left}px, top=${top}px`);
      }
    }
  } else {
    if (node.absoluteBoundingBox) {
      if (node.children && node.children.length > 0) {
        css['position'] = 'relative';
        css['width'] = `${node.absoluteBoundingBox.width}px`;
        css['min-height'] = node.absoluteBoundingBox.height > 0 ? `${node.absoluteBoundingBox.height}px` : 'auto';
        
        if (parentBoundingBox) {
          css['position'] = 'absolute';
          css['left'] = `${node.absoluteBoundingBox.x - parentBoundingBox.x}px`;
          css['top'] = `${node.absoluteBoundingBox.y - parentBoundingBox.y}px`;
        }
      } else {
        if (!node.absoluteBoundingBox) {
        } else {
          const bbox = node.absoluteBoundingBox;
          const parentX = parentBoundingBox?.x;
          const parentY = parentBoundingBox?.y;
          
          if (isParentFlex && parentBoundingBox) {
            css['position'] = 'relative';
            css['width'] = `${bbox.width}px`;
            css['height'] = `${bbox.height}px`;
          } else if (parentBoundingBox && parentX !== undefined && parentY !== undefined) {
            css['position'] = 'absolute';
            css['left'] = `${bbox.x - parentX}px`;
            css['top'] = `${bbox.y - parentY}px`;
            css['width'] = `${bbox.width}px`;
            css['height'] = `${bbox.height}px`;
          } else {
            css['position'] = 'absolute';
            css['left'] = `${bbox.x}px`;
            css['top'] = `${bbox.y}px`;
            css['width'] = `${bbox.width}px`;
            css['height'] = `${bbox.height}px`;
          }
        }
      }
    } else {
      css['display'] = 'block';
    }
  }

  const padding: string[] = [];
  if (node.paddingTop !== undefined) padding.push(`${node.paddingTop}px`);
  if (node.paddingRight !== undefined) padding.push(`${node.paddingRight}px`);
  if (node.paddingBottom !== undefined) padding.push(`${node.paddingBottom}px`);
  if (node.paddingLeft !== undefined) padding.push(`${node.paddingLeft}px`);

  if (padding.length > 0) {
    if (padding.length === 4) {
      css['padding'] = `${padding[0]} ${padding[1]} ${padding[2]} ${padding[3]}`;
    } else if (padding.length === 3) {
      css['padding'] = `${padding[0]} ${padding[1]} ${padding[2]}`;
    } else if (padding.length === 2) {
      css['padding'] = `${padding[0]} ${padding[1]}`;
    } else {
      css['padding'] = padding[0]!;
    }
  }

  if (node.opacity !== undefined && node.opacity !== 1) {
    css['opacity'] = String(node.opacity);
  }

  if (node.clipsContent) {
    css['overflow'] = 'hidden';
  }

  console.log(`  Generated CSS:`, Object.keys(css).length > 0 ? css : '(empty)');
  return css;
}

function mapFigmaAlignment(alignment: string): string {
  const mapping: Record<string, string> = {
    MIN: 'flex-start',
    CENTER: 'center',
    MAX: 'flex-end',
    SPACE_BETWEEN: 'space-between',
    SPACE_AROUND: 'space-around',
  };
  return mapping[alignment] || alignment.toLowerCase();
}

export function figmaEffectsToCSS(effects: FigmaNode['effects'], hasTextChildren: boolean = false): Record<string, string> {
  if (!effects || effects.length === 0) {
    return {};
  }

  const css: Record<string, string> = {};
  const shadows: string[] = [];
  let blur = '';

  for (const effect of effects) {
    if (effect.visible === false) continue;

    switch (effect.type) {
      case 'DROP_SHADOW':
      case 'INNER_SHADOW': {
        if (effect.color && effect.offset && effect.radius !== undefined) {
          const r = Math.round(effect.color.r * 255);
          const g = Math.round(effect.color.g * 255);
          const b = Math.round(effect.color.b * 255);
          const a = effect.color.a ?? 1;
          const x = effect.offset.x;
          const y = effect.offset.y;
          const blurRadius = effect.radius;
          const spread = effect.spread ?? 0;
          const inset = effect.type === 'INNER_SHADOW' ? 'inset ' : '';

          shadows.push(
            `${inset}${x}px ${y}px ${blurRadius}px ${spread}px rgba(${r}, ${g}, ${b}, ${a})`
          );
        }
        break;
      }

      case 'LAYER_BLUR': {
        if (effect.radius !== undefined && !hasTextChildren) {
          blur = `blur(${effect.radius}px)`;
        }
        break;
      }

      case 'BACKGROUND_BLUR': {
        if (effect.radius !== undefined) {
          css['backdrop-filter'] = `blur(${effect.radius}px)`;
        }
        break;
      }
    }
  }

  if (shadows.length > 0) {
    css['box-shadow'] = shadows.join(', ');
  }

  if (blur) {
    css['filter'] = blur;
  }

  return css;
}
