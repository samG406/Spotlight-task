# Figma to HTML/CSS Conversion System

A programmatic system that transforms Figma design files into pixel-accurate HTML/CSS representations by parsing the Figma REST API response and mapping design properties to web standards.

## Problem Statement

Figma stores designs as a hierarchical node tree with properties that don't directly map to HTML/CSS. This system bridges that gap by:
- Interpreting Figma's coordinate system and layout constraints
- Translating design tokens (colors, typography, spacing) to CSS values
- Preserving visual relationships through calculated positioning
- Handling edge cases like nested flex containers and absolute positioning

## Architecture

The system operates in three phases:

**1 Data Acquisition**
- Fetches the complete file structure via Figma REST API
- Extracts node hierarchy, bounding boxes, and computed styles
- Handles both PAGE and CANVAS node types (Figma's internal structure varies)

**2 Node Transformation**
- Recursively traverses the node tree maintaining parent-child relationships
- Calculates relative positioning by comparing absolute bounding boxes
- Determines layout strategy based on `layoutMode` (flex vs absolute positioning)
- Maps Figma node types to semantic HTML elements where applicable

**3 Style Generation**
- Converts Figma's 0-1 color space to RGB/RGBA
- Transforms gradient definitions (linear, radial, angular) to CSS gradient syntax
- Applies typography properties with proper unit conversions (letter-spacing percentages to pixels)
- Generates CSS rules with class-based selectors to maintain specificity control



### Layout Conversion 

**Flexbox Containers**: When an element uses flexbox layout, the system creates flexbox CSS. It checks the sizing settings to decide whether sizes should be fixed pixels or automatic. Elements inside flex containers flow naturally without needing exact positions.

**Absolute Positioning**: For elements that don't use flexbox, the system figures out positions by subtracting parent element coordinates from child element coordinates. This prevents elements from moving to wrong places that happens when using large margin values. Top-level containers use relative positioning to create a reference point for positioning.

### Color and Gradient Handling

Figma uses colors stored as numbers between 0 and 1. The conversion multiplies these by 255 and rounds to whole numbers. For gradients, the system:
- Gets gradient points and converts their positions (0-1) to percentages
- Calculates linear gradient angles from gradient handle positions using math functions
- Maps gradient types to the right CSS functions (linear-gradient, radial-gradient, conic-gradient)

### Typography Conversion

Text elements need special handling because Figma stores text properties separately from colors. The system:
- Applies colors as text color (not background) for text elements
- Converts line height values whether they're in pixels or percentages
- Handles letter-spacing in both pixel and percentage units
- Detects single-line text by comparing line-height to font-size and prevents text wrapping

### Input Field Detection

The system identifies input fields by analyzing node structure: FRAME nodes with borders and a single TEXT child are converted to `<input>` elements. Input type is inferred from node names (email, password patterns), and placeholder text is extracted from child text nodes.

## Usage

### Prerequisites

- Node.js v18+
- Figma API access token 

### Installation

```bash
npm install
```

Create a `.env` file:
```
FIGMA_ACCESS_TOKEN=your_token_here
```

### Running the Conversion

Provide either a Figma file key or full URL:

```bash
npm start [fileKey]
npm start https://www.figma.com/file/abc123xyz/Design-Name
```

The system extracts the file key from URLs and the output is saved to `./output folder

## Project Structure

```
src/
├── index.ts                 # Entry point, handles CLI arguments and orchestration
├── figma/
│   └── client.ts           # Axios-based HTTP client for Figma REST API
├── converter/
│   ├── converter.ts        # Main conversion logic, finds pages and coordinates conversion
│   └── node-to-html.ts     # Recursive node transformation, HTML generation, CSS rule collection
├── utils/
│   ├── color.ts            # Color space conversion, gradient generation, border rendering
│   ├── typography.ts       # Font property mapping, text style conversion
│   └── layout.ts           # Positioning logic, flexbox generation, effect processing
└── types/
    └── figma.ts            # TypeScript interfaces matching Figma API response structure
```

## Limitations

**Image Fills**: Image fills are not supported and render as transparent backgrounds.

**Custom Fonts**: Font family names are preserved in CSS, but font files are not downloaded. Designs will fall back to system fonts.

**Blend Modes**: Figma blend modes are not converted to CSS `mix-blend-mode`.

**Constraints**: Figma's constraint system (MIN/CENTER/MAX/STRETCH/SCALE) is not implemented. No responsive breakpoints are generated.

**Character-Level Styling**: Per-character style overrides within text nodes are not supported.

**Interactive Elements**: Buttons and links are rendered as styled divs, not semantic HTML elements.

**Rotations and Transforms**: Element rotations and transform matrices are not converted to CSS transforms.


## Testing

The system has been tested with:
- Mobile frame designs (fixed width containers)
- Desktop layouts (full-width designs)
- Nested flex containers
- Complex typography with mixed styles
- Gradient backgrounds and borders
- Multiple pages in a single file

## Acknowledgments

Thank you for the opportunity to work on this assignment. 

I appreciate the chance to demonstrate technical problem-solving and attention to detail in creating a generalized solution.
