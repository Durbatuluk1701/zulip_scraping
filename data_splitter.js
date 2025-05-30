/**
 * Data Splitter
 * Convert a given file "input_file" into various markdown files
 * 1. Parse in the input file in schema ({ <key>header: <value>markdown_content })
 * 2. For each of the entries, print them to a markdown file `header.md` in the format:
 * """
 * # <header>
 * 
 * <markdown_content>
 * """
 * 
 * Usage: node data_splitter.js <input_file> [output_directory]
 */

const fs = require('fs');
const path = require('path');

/**
 * Parses command line arguments
 * @returns {Object} - Object containing inputFile and outputDir paths
 */
function parseArguments() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('❌ Error: Missing required arguments');
    console.log('Usage: node data_splitter.js <input_file> [output_directory]');
    console.log('Example: node data_splitter.js cleaned_data/messages_cleaned.json markdown_files/');
    process.exit(1);
  }

  return {
    inputFile: path.resolve(args[0]),
    outputDir: args[1] ? path.resolve(args[1]) : path.dirname(path.resolve(args[0]))
  };
}

/**
 * Sanitizes a filename by removing or replacing invalid characters
 * @param {string} filename - The original filename
 * @returns {string} - Sanitized filename safe for filesystem
 */
function sanitizeFilename(filename) {
  // Replace invalid characters with underscores
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

/**
 * Creates a markdown file from header and content
 * @param {string} header - The header/topic name
 * @param {string} content - The markdown content
 * @param {string} outputDir - Directory to save the file
 */
function createMarkdownFile(header, content, outputDir) {
  const sanitizedHeader = sanitizeFilename(header);
  const filename = `${sanitizedHeader}.md`;
  const filepath = path.join(outputDir, filename);

  const markdownContent = `# ${header}\n\n${content}`;

  try {
    fs.writeFileSync(filepath, markdownContent, 'utf8');
    console.log(`✅ Created: ${filename}`);
  } catch (error) {
    console.error(`❌ Error creating ${filename}:`, error.message);
  }
}

/**
 * Main function to split data into markdown files
 */
async function splitData(inputFile, outputDir) {
  try {
    console.log('Reading input file:', inputFile);

    // Validate input file exists
    if (!fs.existsSync(inputFile)) {
      throw new Error(`Input file does not exist: ${inputFile}`);
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log('Created output directory:', outputDir);
    }

    // Step 1: Read and parse the JSON file
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const data = JSON.parse(rawData);

    console.log('Found', Object.keys(data).length, 'entries to split');

    // Step 2: Create markdown files for each entry
    let successCount = 0;
    for (const [header, markdownContent] of Object.entries(data)) {
      console.log(`Processing: "${header}"`);
      createMarkdownFile(header, markdownContent, outputDir);
      successCount++;
    }

    console.log('✅ Splitting completed successfully!');
    console.log('📊 Statistics:');
    console.log(`   - Files created: ${successCount}`);
    console.log(`   - Output directory: ${outputDir}`);

  } catch (error) {
    console.error('❌ Error splitting data:', error.message);
    process.exit(1);
  }
}

// Run the splitter if this file is executed directly
if (require.main === module) {
  const { inputFile, outputDir } = parseArguments();
  splitData(inputFile, outputDir);
}

module.exports = {
  splitData,
  createMarkdownFile,
  sanitizeFilename,
  parseArguments
};