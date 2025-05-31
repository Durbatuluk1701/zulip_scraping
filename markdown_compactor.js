/**
 * Markdown Compactor (Stage 4 of 4)
 * =================================
 * 
 * This script compacts individual markdown files into N roughly equal-sized grouped files.
 * It's an optional fourth stage in the Zulip processing pipeline for easier management.
 * 
 * PIPELINE OVERVIEW:
 * Stage 1: zulip_scraper.js  → Raw JSON data 
 * Stage 2: zulip_cleaner.js  → Cleaned markdown per topic
 * Stage 3: data_splitter.js  → Individual markdown files
 * Stage 4: markdown_compactor.js → Grouped markdown files ← YOU ARE HERE
 * 
 * WHAT THIS SCRIPT DOES:
 * 1. Reads all markdown files from the input directory
 * 2. Distributes them evenly across N output files
 * 3. Combines files with horizontal rule separators
 * 4. Creates organized, manageable file groups
 * 
 * USE CASES:
 * - Large numbers of topic files become unwieldy to navigate
 * - Want to create digestible chunks for documentation
 * - Need to reduce file count for certain platforms or tools
 * - Create themed or sized groupings of related topics
 * 
 * FEATURES:
 * - Even distribution across N files (by count, not size)
 * - Maintains original content and formatting
 * - Clear separation with horizontal rules
 * - Descriptive filenames showing file ranges
 * - Progress tracking and statistics
 * 
 * USAGE:
 * node markdown_compactor.js <input_directory> <output_directory> <N>
 * 
 * EXAMPLES:
 * node markdown_compactor.js markdown_files/ compacted/ 5
 * node markdown_compactor.js docs/topics/ docs/grouped/ 10
 * 
 * OUTPUT FORMAT:
 * Creates files like: group_1_of_5.md, group_2_of_5.md, etc.
 * Each file contains multiple topics separated by "---" horizontal rules
 */

const fs = require('fs');
const path = require('path');

/**
 * Parses command line arguments
 * @returns {Object} - Object containing inputDir, outputDir, and groupCount
 */
function parseArguments() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('❌ Error: Missing required arguments');
    console.log('Usage: node markdown_compactor.js <input_directory> <output_directory> <N>');
    console.log('');
    console.log('Arguments:');
    console.log('  input_directory   - Directory containing individual markdown files');
    console.log('  output_directory  - Directory for compacted group files');
    console.log('  N                 - Number of groups to create');
    console.log('');
    console.log('Examples:');
    console.log('  node markdown_compactor.js markdown_files/ compacted/ 5');
    console.log('  node markdown_compactor.js docs/topics/ docs/grouped/ 10');
    process.exit(1);
  }

  const groupCount = parseInt(args[2], 10);
  if (isNaN(groupCount) || groupCount < 1) {
    console.error('❌ Error: N must be a positive integer');
    process.exit(1);
  }

  return {
    inputDir: path.resolve(args[0]),
    outputDir: path.resolve(args[1]),
    groupCount: groupCount
  };
}

/**
 * Gets all markdown files from a directory
 * @param {string} directory - Directory to scan for markdown files
 * @returns {Array} - Array of markdown file paths
 */
function getMarkdownFiles(directory) {
  try {
    const files = fs.readdirSync(directory);
    return files
      .filter(file => file.toLowerCase().endsWith('.md'))
      .map(file => path.join(directory, file))
      .sort(); // Sort for consistent ordering
  } catch (error) {
    throw new Error(`Cannot read input directory: ${error.message}`);
  }
}

/**
 * Distributes an array of items into N roughly equal groups
 * @param {Array} items - Items to distribute
 * @param {number} groupCount - Number of groups to create
 * @returns {Array} - Array of arrays, each containing group items
 */
function distributeIntoGroups(items, groupCount) {
  if (groupCount >= items.length) {
    // If we have more groups than items, put one item per group
    return items.map(item => [item]);
  }

  const groups = Array.from({ length: groupCount }, () => []);
  
  // Distribute items round-robin style for even distribution
  items.forEach((item, index) => {
    const groupIndex = index % groupCount;
    groups[groupIndex].push(item);
  });

  return groups;
}

/**
 * Reads and combines markdown files with horizontal rule separators
 * @param {Array} filePaths - Array of file paths to combine
 * @returns {string} - Combined markdown content
 */
function combineMarkdownFiles(filePaths) {
  const contents = [];
  
  for (const filePath of filePaths) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const filename = path.basename(filePath, '.md');
      
      // Add a comment showing the original filename for reference
      contents.push(`<!-- Source: ${filename}.md -->`);
      contents.push(content.trim());
    } catch (error) {
      console.warn(`⚠️  Warning: Could not read file ${filePath}: ${error.message}`);
    }
  }
  
  // Join with horizontal rules between files
  return contents.join('\n\n---\n\n');
}

/**
 * Creates a descriptive filename for a group
 * @param {number} groupIndex - Zero-based group index
 * @param {number} totalGroups - Total number of groups
 * @param {number} fileCount - Number of files in this group
 * @returns {string} - Descriptive filename
 */
function createGroupFilename(groupIndex, totalGroups, fileCount) {
  const groupNumber = groupIndex + 1;
  return `group_${groupNumber}_of_${totalGroups}_${fileCount}_files.md`;
}

/**
 * Main function to compact markdown files
 */
async function compactMarkdownFiles(inputDir, outputDir, groupCount) {
  try {
    console.log('🔄 Starting markdown compaction...');
    console.log(`   Input directory: ${inputDir}`);
    console.log(`   Output directory: ${outputDir}`);
    console.log(`   Target groups: ${groupCount}`);
    console.log('');

    // Validate input directory exists
    if (!fs.existsSync(inputDir)) {
      throw new Error(`Input directory does not exist: ${inputDir}`);
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`✅ Created output directory: ${outputDir}`);
    }

    // Get all markdown files
    const markdownFiles = getMarkdownFiles(inputDir);
    
    if (markdownFiles.length === 0) {
      console.warn('⚠️  No markdown files found in input directory');
      return;
    }

    console.log(`📄 Found ${markdownFiles.length} markdown files`);

    // Distribute files into groups
    const fileGroups = distributeIntoGroups(markdownFiles, groupCount);
    const actualGroupCount = fileGroups.length;

    console.log(`📦 Distributing into ${actualGroupCount} groups:`);
    
    // Process each group
    let totalFilesProcessed = 0;
    
    for (let i = 0; i < fileGroups.length; i++) {
      const group = fileGroups[i];
      if (group.length === 0) continue;

      const groupFilename = createGroupFilename(i, actualGroupCount, group.length);
      const outputPath = path.join(outputDir, groupFilename);
      
      console.log(`   Group ${i + 1}: ${group.length} files → ${groupFilename}`);
      
      // Combine files in this group
      const combinedContent = combineMarkdownFiles(group);
      
      // Write the combined file
      fs.writeFileSync(outputPath, combinedContent, 'utf8');
      totalFilesProcessed += group.length;
    }

    console.log('');
    console.log('✅ Compaction completed successfully!');
    console.log('📊 Statistics:');
    console.log(`   - Input files processed: ${totalFilesProcessed}`);
    console.log(`   - Output groups created: ${actualGroupCount}`);
    console.log(`   - Average files per group: ${Math.round(totalFilesProcessed / actualGroupCount)}`);
    console.log(`   - Output directory: ${outputDir}`);

  } catch (error) {
    console.error('❌ Error compacting markdown files:', error.message);
    process.exit(1);
  }
}

// Run the compactor if this file is executed directly
if (require.main === module) {
  const { inputDir, outputDir, groupCount } = parseArguments();
  compactMarkdownFiles(inputDir, outputDir, groupCount);
}

module.exports = {
  compactMarkdownFiles,
  distributeIntoGroups,
  combineMarkdownFiles,
  getMarkdownFiles,
  parseArguments
};
