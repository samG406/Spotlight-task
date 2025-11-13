import type { FigmaNode } from '../types/figma.js';
import { figmaFillToCSS, figmaStrokeToCSS, getBorderRadius } from '../utils/color.js';
import { figmaTextStyleToCSS } from '../utils/typography.js';
import { figmaLayoutToCSS, figmaEffectsToCSS } from '../utils/layout.js';

export interface HTMLNode {
  tag: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
  className?: string;
  children: HTMLNode[];
  text?: string;
}

export interface CSSRule {
  selector: string;
  properties: Record<string, string>;
}

let classCounter = 0;
const cssRules: CSSRule[] = [];

function generateUniqueClassName(node: FigmaNode): string {
  classCounter++;
  const baseName = node.id.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || `element-${classCounter}`;
  return `figma-${baseName}`;
}

export function figmaNodeToHTML(node: FigmaNode, parentStyles: Record<string, string> = {}, cssRulesArray: CSSRule[] = []): HTMLNode | null {
  if (node.visible === false) {
    return null;
  }

  const nodeName = node.name || node.type;
  console.log(`\n>>> Converting: ${nodeName} (${node.type})`);
  if (node.children) {
    console.log(`    Has ${node.children.length} children`);
  }
  const uniqueClassName = generateUniqueClassName(node);
  
  let semanticClassName: string | undefined;
  if (node.name) {
    const sanitized = node.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    
    if (sanitized && /[a-z]/.test(sanitized)) {
      semanticClassName = sanitized;
    }
  }

  const combinedClassName = semanticClassName 
    ? `${uniqueClassName} ${semanticClassName}` 
    : uniqueClassName;

  const htmlTag = getHTMLTag(node);
  
  const htmlNode: HTMLNode = {
    tag: htmlTag,
    attributes: { class: combinedClassName },
    styles: {},
    className: uniqueClassName,
    children: [],
  };

  if (htmlTag === 'input') {
    const name = node.name.toLowerCase();
    if (name.includes('password')) {
      htmlNode.attributes['type'] = 'password';
    } else if (name.includes('email')) {
      htmlNode.attributes['type'] = 'email';
    } else {
      htmlNode.attributes['type'] = 'text';
    }
    
    if (node.children && node.children.length === 1 && node.children[0]?.type === 'TEXT') {
      htmlNode.attributes['placeholder'] = node.children[0].characters || '';
    }
  }

  const parentBoundingBox = parentStyles['parent-x'] && parentStyles['parent-y'] 
    ? { x: parseFloat(parentStyles['parent-x']), y: parseFloat(parentStyles['parent-y']) }
    : undefined;

  const isParentFlex = parentStyles['parent-is-flex'] === 'true';

  const actualParentStyles: Record<string, string> = {};
  for (const [key, value] of Object.entries(parentStyles)) {
    if (key !== 'parent-x' && key !== 'parent-y' && key !== 'parent-is-flex') {
      actualParentStyles[key] = value;
    }
  }

  Object.assign(htmlNode.styles, actualParentStyles);

  const layoutStyles = figmaLayoutToCSS(node, parentBoundingBox, isParentFlex);
  Object.assign(htmlNode.styles, layoutStyles);

  if (node.type === 'TEXT' && node.characters && htmlTag !== 'input') {
    console.log(`\n=== TEXT: "${node.characters.substring(0, 30)}" ===`);
    console.log(`  Font: ${node.style?.fontFamily || 'N/A'}, Size: ${node.style?.fontSize || 'N/A'}px`);
    console.log(`  Weight: ${node.style?.fontWeight || 'N/A'}, Color: ${figmaFillToCSS(node.fills || node.background)}`);

    htmlNode.text = node.characters;
    const textStyles = figmaTextStyleToCSS(node.style);
    Object.assign(htmlNode.styles, textStyles);
    
    if (!htmlNode.styles['color']) {
      const textColor = figmaFillToCSS(node.fills || node.background);
      if (textColor !== 'transparent') {
        htmlNode.styles['color'] = textColor;
      }
    }
  } else if (htmlTag === 'input') {
    if (node.children && node.children.length === 1 && node.children[0]?.type === 'TEXT') {
      const textChild = node.children[0];
      const textStyles = figmaTextStyleToCSS(textChild.style);
      Object.assign(htmlNode.styles, textStyles);
      
      if (!htmlNode.styles['color']) {
        const textColor = figmaFillToCSS(textChild.fills || textChild.background);
        if (textColor !== 'transparent') {
          htmlNode.styles['color'] = textColor;
        }
      }
    }
  } else {
    const background = figmaFillToCSS(node.fills || node.background);
    if (background !== 'transparent') {
      htmlNode.styles['background'] = background;
    }
  }

  const border = figmaStrokeToCSS(node.strokes, node.strokeWeight, node.strokeAlign);
  if (border !== 'none') {
    htmlNode.styles['border'] = border;
  }
  
  if (node.cornerRadius !== undefined && node.cornerRadius > 0) {
    htmlNode.styles['border-radius'] = getBorderRadius(node.cornerRadius, node.absoluteBoundingBox);
  }

  const hasTextChildren = node.children?.some(child => child.type === 'TEXT' && child.characters) || false;
  const effectStyles = figmaEffectsToCSS(node.effects, hasTextChildren);
  Object.assign(htmlNode.styles, effectStyles);

  if (node.children && node.children.length > 0) {
    const parentBox = node.absoluteBoundingBox;
    const isFlexContainer = !!node.layoutMode;
    
    if (parentBox) {
      console.log(`\n  >>> Processing ${node.children.length} children of "${nodeName}"`);
      console.log(`  >>> Parent box: x=${parentBox.x}, y=${parentBox.y}, w=${parentBox.width}, h=${parentBox.height}`);
      console.log(`  >>> Parent is flex: ${isFlexContainer}`);
    }
    
    for (const child of node.children) {
      if (htmlTag === 'input' && child.type === 'TEXT') {
        continue;
      }
      
      const childParentStyles: Record<string, string> = {};
      if (parentBox) {
        childParentStyles['parent-x'] = String(parentBox.x);
        childParentStyles['parent-y'] = String(parentBox.y);
      }
      if (isFlexContainer) {
        childParentStyles['parent-is-flex'] = 'true';
      }
      
      const childHTML = figmaNodeToHTML(child, childParentStyles, cssRulesArray);
      if (childHTML) {
        htmlNode.children.push(childHTML);
      }
    }
  }

  if (htmlNode.styles && Object.keys(htmlNode.styles).length > 0) {
    cssRulesArray.push({
      selector: `.${uniqueClassName}`,
      properties: htmlNode.styles,
    });
    htmlNode.styles = {};
  }

  return htmlNode;
}

function isInputField(node: FigmaNode): boolean {
  if (node.type === 'FRAME' && node.strokes && node.strokes.length > 0) {
    if (node.children && node.children.length === 1 && node.children[0]?.type === 'TEXT') {
      return true;
    }
    const name = node.name.toLowerCase();
    if (name.includes('input') || name.includes('field') || name.includes('email') || name.includes('password')) {
      return true;
    }
  }
  return false;
}

function getHTMLTag(node: FigmaNode): string {
  if (isInputField(node)) {
    const name = node.name.toLowerCase();
    if (name.includes('password')) {
      return 'input';
    }
    if (name.includes('email')) {
      return 'input';
    }
    return 'input';
  }

  const tagMap: Record<string, string> = {
    TEXT: 'p',
    RECTANGLE: 'div',
    ELLIPSE: 'div',
    POLYGON: 'div',
    STAR: 'div',
    VECTOR: 'div',
    LINE: 'div',
    FRAME: 'div',
    GROUP: 'div',
    COMPONENT: 'div',
    INSTANCE: 'div',
    BOOLEAN_OPERATION: 'div',
    SLICE: 'div',
    SECTION: 'section',
    PAGE: 'div',
    DOCUMENT: 'div',
  };

  return tagMap[node.type] || 'div';
}

export function htmlNodeToString(node: HTMLNode, indent: number = 0): string {
  const indentStr = '  '.repeat(indent);

  let html = `${indentStr}<${node.tag}`;

  for (const [key, value] of Object.entries(node.attributes)) {
    html += ` ${key}="${value.replace(/"/g, '&quot;')}"`;
  }

  if (node.text !== undefined) {
    html += `>${escapeHtml(node.text)}</${node.tag}>\n`;
  } else if (node.children.length === 0) {
    html += `></${node.tag}>\n`;
  } else {
    html += `>\n`;
    for (const child of node.children) {
      html += htmlNodeToString(child, indent + 1);
    }
    html += `${indentStr}</${node.tag}>\n`;
  }

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function collectCSSRules(node: HTMLNode, rules: CSSRule[]): void {
  for (const child of node.children) {
    collectCSSRules(child, rules);
  }
}

function generateCSS(rules: CSSRule[]): string {
  let css = '';
  for (const rule of rules) {
    css += `    ${rule.selector} {\n`;
    for (const [property, value] of Object.entries(rule.properties)) {
      css += `      ${property}: ${value};\n`;
    }
    css += `    }\n\n`;
  }
  return css;
}

export function generateHTMLDocument(nodes: HTMLNode[], title: string = 'Figma Design', cssRules?: CSSRule[], pageWidth?: number): string {
  classCounter = 0;
  
  const allCSSRules: CSSRule[] = cssRules || [];
  if (!cssRules) {
    for (const node of nodes) {
      collectCSSRules(node, allCSSRules);
    }
  }

  const css = generateCSS(allCSSRules);

  const pageMaxWidthStyle = pageWidth ? `${pageWidth}px` : '100%';
  const pageWidthStyle = pageWidth ? 'auto' : '100%';

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      overflow-x: hidden;
      overflow-y: auto;
    }
    .page {
      position: relative;
      width: ${pageWidthStyle};
      max-width: ${pageMaxWidthStyle};
      overflow: hidden;
    }
${css}  </style>
</head>
<body>
`;

  for (const node of nodes) {
    html += htmlNodeToString(node, 1);
  }

  html += `</body>
</html>`;

  return html;
}
