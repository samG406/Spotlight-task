import * as dotenv from 'dotenv';
import { FigmaClient } from './figma/client.js';
import { FigmaToHTMLConverter } from './converter/converter.js';

dotenv.config();

async function main() {
  const figmaToken = process.env.FIGMA_ACCESS_TOKEN;
  const arg = process.argv[2];

  if (!figmaToken) {
    console.error('Error: FIGMA_ACCESS_TOKEN environment variable is required');
    console.error('Get your token from: https://www.figma.com/developers/api#access-tokens');
    process.exit(1);
  }

  if (!arg) {
    console.error('Error: Please provide a Figma file key or URL');
    console.error('Usage: npm start [fileKey] or npm start [url]');
    process.exit(1);
  }

  try {
    const fileKey = arg.startsWith('http') 
      ? FigmaClient.extractFileKey(arg)
      : arg;
    
    if (arg.startsWith('http')) {
      console.log(`Extracted file key from URL: ${fileKey}`);
    }

    console.log('Fetching Figma file...');
    const client = new FigmaClient(figmaToken);
    const fileData = await client.getFile(fileKey);

    console.log('\n=== FILE STRUCTURE ===');
    console.log('File name:', fileData.name);
    console.log('Document type:', fileData.document.type);
    console.log('Document children:', fileData.document.children?.length || 0);

    if (fileData.document.children && fileData.document.children.length > 0) {
      const firstPage = fileData.document.children[0];
      console.log('\nFirst page:', firstPage?.name);
      console.log('Page type:', firstPage?.type);
      console.log('Page children:', firstPage?.children?.length || 0);
      
      if (firstPage?.children) {
        console.log('\nPage children:');
        firstPage?.children.forEach((child, i) => {
          console.log(`  ${i + 1}. ${child.name || 'Unnamed'} (${child.type})`);
        });
      }
    }
    console.log(`File: ${fileData.name}`);
    console.log(`Version: ${fileData.version}`);
    console.log(`Last modified: ${fileData.lastModified}`);

    console.log('\nConverting to HTML...');
    const converter = new FigmaToHTMLConverter();
    const outputPath = await converter.convert(fileData, {
      outputDir: './output',
      outputFileName: `${fileData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`,
    });

    console.log(`\n✓ Conversion complete!`);
    console.log(`Output file: ${outputPath}`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
