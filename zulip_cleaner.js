/**
 * Zulip Cleaner
 * This script cleans up Zulpi channel topics by collapsing them into a single markdown blob
 * Steps:
 * 1. Read in the Zulip channel scraped data from a JSON file.
 * (The schema is { <key>topic: [{ sender: string, content : string }]})
 * 2. Collapse the topics into a single markdown blob. 
 * This will be achieved by:
 *   - Iterating through each topic.
 *   - For each topic, iterating through each message.
 *   - For each message, appending the sender and content to a markdown string in the format (<sender>: <content>).
 *    - Note: If multiple messages are from the same sender, they will be concatenated.
 * 3. Write the new format to a new JSON file of schema ({ <key>topic: markdown_blob })
 * 
 * Usage: node zulip_cleaner.js <input_file> <output_file>
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
