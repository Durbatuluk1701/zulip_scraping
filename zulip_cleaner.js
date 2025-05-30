/**
 * Zulip Data Cleaner (Stage 2 of 3)
 * =================================
 * 
 * This script processes raw Zulip scraped data and consolidates messages into markdown format.
 * It's the second stage in the Zulip processing pipeline.
 * 
 * PIPELINE OVERVIEW:
 * Stage 1: zulip_scraper.js  → Raw JSON data 
 * Stage 2: zulip_cleaner.js  → Cleaned markdown per topic ← YOU ARE HERE
 * Stage 3: data_splitter.js  → Individual markdown files
 * 
 * WHAT THIS SCRIPT DOES:
 * 1. Reads raw scraped JSON data with message arrays per topic
 * 2. Merges consecutive messages from the same sender 
 * 3. Converts each topic's messages into a single markdown blob
 * 4. Outputs cleaned data ready for splitting into individual files
 * 
 * INPUT FORMAT:
 * {
 *   "topic_name": [
 *     { "sender": "alice", "content": "First message" },
 *     { "sender": "alice", "content": "Continuation" },
 *     { "sender": "bob", "content": "Reply" }
 *   ]
 * }
 * 
 * OUTPUT FORMAT:
 * {
 *   "topic_name": "**alice:** First message\n\nContinuation\n\n**bob:** Reply"
 * }
 * 
 * FEATURES:
 * - Smart message consolidation (merges consecutive messages from same sender)
 * - Preserves conversation flow and context
 * - Clean markdown formatting with proper spacing
 * - Automatic directory creation
 * - Progress tracking and error handling
 * 
 * USAGE:
 * node zulip_cleaner.js <input_file> <output_file>
 * 
 * EXAMPLES:
 * node zulip_cleaner.js data/messages.json cleaned_data/messages_cleaned.json
 * node zulip_cleaner.js data/rocq_ltac2_zulip_messages.json cleaned_data/rocq_ltac2_cleaned.json
 * 
 * NEXT STEPS:
 * After cleaning, use data_splitter.js to create individual markdown files:
 * node data_splitter.js cleaned_data/your_file_cleaned.json markdown_files/
 */

const fs = require('fs');
const path = require('path');

/**
 * Parses command line arguments
 * @returns {Object} - Object containing inputFile and outputFile paths
 */
function parseArguments() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Error: Missing required arguments');
    console.log('Usage: node zulip_cleaner.js <input_file> <output_file>');
    console.log('Example: node zulip_cleaner.js data/messages.json cleaned_data/messages_cleaned.json');
    process.exit(1);
  }

  return {
    inputFile: path.resolve(args[0]),
    outputFile: path.resolve(args[1])
  };
}

/**
 * Collapses messages from the same sender into a single entry
 * @param {Array} messages - Array of message objects with sender and content
 * @returns {Array} - Array with consecutive messages from same sender collapsed
 */
function collapseConsecutiveMessages(messages) {
  if (!messages || messages.length === 0) return [];

  const collapsed = [];
  let currentSender = messages[0].sender;
  let currentContent = messages[0].content;

  for (let i = 1; i < messages.length; i++) {
    if (messages[i].sender === currentSender) {
      // Same sender, append content
      currentContent += '\n\n' + messages[i].content;
    } else {
      // Different sender, save current and start new
      collapsed.push({ sender: currentSender, content: currentContent });
      currentSender = messages[i].sender;
      currentContent = messages[i].content;
    }
  }

  // Don't forget the last message
  collapsed.push({ sender: currentSender, content: currentContent });
  return collapsed;
}

/**
 * Converts an array of messages to a markdown string
 * @param {Array} messages - Array of message objects with sender and content
 * @returns {string} - Markdown formatted string
 */
function messagesToMarkdown(messages) {
  if (!messages || messages.length === 0) return '';

  // First collapse consecutive messages from the same sender
  const collapsedMessages = collapseConsecutiveMessages(messages);

  // Convert to markdown format
  return collapsedMessages
    .map(message => `**${message.sender}:** ${message.content}`)
    .join('\n\n');
}

/**
 * Main function to clean Zulip data
 */
async function cleanZulipData(inputFile, outputFile) {
  try {
    console.log('Reading input file:', inputFile);

    // Validate input file exists
    if (!fs.existsSync(inputFile)) {
      throw new Error(`Input file does not exist: ${inputFile}`);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Step 1: Read the JSON file
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const zulipData = JSON.parse(rawData);

    console.log('Found', Object.keys(zulipData).length, 'topics');

    // Step 2: Process each topic
    const cleanedData = {};

    for (const [topicName, messages] of Object.entries(zulipData)) {
      console.log(`Processing topic: "${topicName}" (${messages.length} messages)`);

      // Convert messages to markdown blob
      const markdownBlob = messagesToMarkdown(messages);
      cleanedData[topicName] = markdownBlob;
    }

    // Step 3: Write the cleaned data to a new JSON file
    console.log('Writing output file:', outputFile);
    fs.writeFileSync(outputFile, JSON.stringify(cleanedData, null, 2), 'utf8');

    console.log('✅ Cleaning completed successfully!');
    console.log('📊 Statistics:');
    console.log(`   - Topics processed: ${Object.keys(cleanedData).length}`);
    console.log(`   - Output file: ${outputFile}`);

  } catch (error) {
    console.error('❌ Error cleaning Zulip data:', error.message);
    process.exit(1);
  }
}

// Run the cleaner if this file is executed directly
if (require.main === module) {
  const { inputFile, outputFile } = parseArguments();
  cleanZulipData(inputFile, outputFile);
}

module.exports = {
  cleanZulipData,
  messagesToMarkdown,
  collapseConsecutiveMessages,
  parseArguments
};
