import type { FigmaFileResponse, FigmaNode } from '../types/figma.js';
import { figmaNodeToHTML, generateHTMLDocument } from './node-to-html.js';
import type { HTMLNode, CSSRule } from './node-to-html.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ConversionOptions {
  outputDir?: string;
  outputFileName?: string;
  includeStylesheet?: boolean;
  minify?: boolean;
}

export class FigmaToHTMLConverter {
  async convert(fileData: FigmaFileResponse, options: ConversionOptions = {}): Promise<string> {
    const {
      outputDir = './output',
      outputFileName = 'figma-design.html',
      includeStylesheet = false,
      minify = false,
    } = options;

    const pages = this.findPages(fileData.document);

    const htmlNodes: HTMLNode[] = [];
    const cssRulesArray: CSSRule[] = [];
    let pageWidth: number | undefined;
    
    for (const page of pages) {
      const htmlNode = figmaNodeToHTML(page, {}, cssRulesArray);
      if (htmlNode) {
        if (htmlNode.attributes.class) {
          htmlNode.attributes.class += ' page';
        } else {
          htmlNode.attributes.class = 'page';
        }
        htmlNodes.push(htmlNode);
        if (!pageWidth) {
          if (page.absoluteBoundingBox) {
            pageWidth = page.absoluteBoundingBox.width;
          } else if (page.children && page.children.length > 0) {
            for (const child of page.children) {
              if (child.absoluteBoundingBox && child.absoluteBoundingBox.width > 0) {
                pageWidth = child.absoluteBoundingBox.width;
                break;
              }
            }
          }
        }
      }
    }

    if (htmlNodes.length === 0) {
      const htmlNode = figmaNodeToHTML(fileData.document, {}, cssRulesArray);
      if (htmlNode) {
        if (htmlNode.attributes.class) {
          htmlNode.attributes.class += ' page';
        } else {
          htmlNode.attributes.class = 'page';
        }
        htmlNodes.push(htmlNode);
        if (!pageWidth) {
          if (fileData.document.absoluteBoundingBox) {
            pageWidth = fileData.document.absoluteBoundingBox.width;
          } else if (fileData.document.children && fileData.document.children.length > 0) {
            const firstChild = fileData.document.children[0];
            if (firstChild && firstChild.absoluteBoundingBox) {
              pageWidth = firstChild.absoluteBoundingBox.width;
            }
          }
        }
      }
    }

    const html = generateHTMLDocument(htmlNodes, fileData.name || 'Figma Design', cssRulesArray, pageWidth);

    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, outputFileName);
    await fs.writeFile(outputPath, html, 'utf-8');

    return outputPath;
  }

  private findPages(document: FigmaNode): FigmaNode[] {
    const pages: FigmaNode[] = [];

    if (document.type === 'PAGE' || document.type === 'CANVAS') {
      pages.push(document);
    } else if (document.children) {
      for (const child of document.children) {
        if (child.type === 'PAGE' || child.type === 'CANVAS') {
          pages.push(child);
        } else {
          pages.push(...this.findPages(child));
        }
      }
    }

    return pages;
  }

  convertNode(node: FigmaNode): string {
    const htmlNode = figmaNodeToHTML(node);
    if (!htmlNode) {
      return '';
    }
    return generateHTMLDocument([htmlNode], 'Figma Node');
  }
}
