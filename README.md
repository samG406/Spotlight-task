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


**Flexbox Containers**: When a node has `layoutMode` set, it generates flexbox CSS. The system detects `primaryAxisSizingMode` and `counterAxisSizingMode` to determine whether dimensions should be fixed pixels or auto-sized. Children within flex containers flow naturally without explicit positioning.

**Absolute Positioning**: For non-flex containers, the system calculates offsets by subtracting parent bounding box coordinates from child coordinates. This prevents layout drift that occurs when using large margin values. Root-level containers use relative positioning to establish a positioning context.

### Color and Gradient Handling

Figma uses a 0-1 normalized color space. The conversion multiplies values by 255 and rounds to integers. For gradients, the system:
- Extracts gradient stops and converts positions (0-1) to percentages
- Calculates linear gradient angles from `gradientHandlePositions` using atan2
- Maps gradient types to appropriate CSS functions (linear-gradient, radial-gradient, conic-gradient)

### Typography Conversion

Text nodes require special handling because Figma stores text properties separately from fills. The system:
- Applies fills as `color` (not `background`) for text nodes
- Converts `lineHeightPx` and `lineHeightPercent` appropriately
- Handles letter-spacing in both PIXELS and PERCENT units
- Detects single-line text by comparing line-height to font-size ratio and applies `white-space: nowrap`

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
