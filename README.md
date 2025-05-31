# Zulip Scraping & Processing Pipeline

A comprehensive toolkit for scraping, cleaning, and organizing Zulip channel data into markdown files. This pipeline consists of three main stages that work together to transform Zulip conversations into organized, searchable markdown documentation.

## 🔄 Pipeline Overview

This toolkit follows a four-stage process:

1. **🕷️ Scraping**: Extract raw messages from Zulip channels using browser automation
2. **🧹 Cleaning**: Process and consolidate messages into markdown format
3. **📄 Splitting**: Generate individual markdown files for each topic
4. **📦 Compacting**: Group individual files into manageable collections _(optional)_

```
Zulip Channel → Raw JSON → Cleaned JSON → Individual Files → Grouped Files
     ↓              ↓            ↓               ↓              ↓
[zulip_scraper] → [zulip_cleaner] → [data_splitter] → [markdown_compactor] → [compacted/]
```

## 🚀 Quick Start

### Prerequisites

- Node.js (for cleaning and splitting scripts)
- Modern web browser (for scraping)

### Complete Workflow

```bash
# 1. Scrape data from Zulip (see browser instructions below)
# This creates: data/your_channel_messages.json

# 2. Clean and consolidate the scraped data
node zulip_cleaner.js data/your_channel_messages.json cleaned_data/your_channel_cleaned.json

# 3. Split into individual markdown files
node data_splitter.js cleaned_data/your_channel_cleaned.json markdown_files/

# 4. (Optional) Compact into manageable groups
node markdown_compactor.js markdown_files/ compacted/ 5
```

## 📖 Detailed Usage

### Stage 1: Scraping (`zulip_scraper.js`)

**Purpose**: Extract all messages from a Zulip channel and download as JSON.

**Instructions**:

1. Open your web browser and navigate to the Zulip channel you want to scrape
2. Scroll to the **top** of the channel (important for complete scraping)
3. Open the browser's developer console (F12)
4. Copy and paste the entire contents of [`zulip_scraper.js`](./zulip_scraper.js)
5. Press Enter and wait for the script to complete
6. The script will automatically download a JSON file with all messages

**Output**:

- File: `{channel_name}_messages.json`
- Format: `{ "topic_name": [{ "sender": "username", "content": "message" }] }`

### Stage 2: Cleaning (`zulip_cleaner.js`)

**Purpose**: Convert raw message arrays into consolidated markdown format per topic.

**Features**:

- Merges consecutive messages from the same sender
- Converts to clean markdown format
- Preserves conversation flow and context

**Usage**:

```bash
node zulip_cleaner.js <input_file> <output_file>

# Example:
node zulip_cleaner.js data/rocq_ltac2_zulip_messages.json cleaned_data/rocq_ltac2_cleaned.json
```

**Input Format**:

```json
{
  "topic_name": [
    {"sender": "alice", "content": "First message"},
    {"sender": "alice", "content": "Second message"},
    {"sender": "bob", "content": "Reply message"}
  ]
}
```

**Output Format**:

```json
{
  "topic_name": "**alice:** First message\n\nSecond message\n\n**bob:** Reply message"
}
```

### Stage 3: Splitting (`data_splitter.js`)

**Purpose**: Generate individual markdown files for each topic for easy browsing and searching.

**Features**:

- Creates properly formatted markdown files
- Sanitizes filenames for cross-platform compatibility
- Organizes files in a specified directory

**Usage**:

```bash
node data_splitter.js <input_file> [output_directory]

# Examples:
node data_splitter.js cleaned_data/rocq_ltac2_cleaned.json
node data_splitter.js cleaned_data/rocq_ltac2_cleaned.json markdown_files/
```

**Output**: Individual `.md` files with format:

```markdown
# Topic Name

**alice:** First message

Second message

**bob:** Reply message
```

### Stage 4: Compacting (`markdown_compactor.js`) _(Optional)_

**Purpose**: Group individual markdown files into N manageable collections for easier navigation and organization.

**Use Cases**:

- Large numbers of topic files become unwieldy to browse
- Need to create digestible chunks for documentation platforms
- Want to reduce file count for certain tools or workflows
- Create themed or sized groupings of related content

**Features**:

- Even distribution of files across N groups (by count)
- Maintains original content and formatting
- Clear separation with horizontal rules (`---`)
- Descriptive filenames showing group info
- Source file tracking with comments

**Usage**:

```bash
node markdown_compactor.js <input_directory> <output_directory> <N>

# Examples:
node markdown_compactor.js markdown_files/ compacted/ 5
node markdown_compactor.js docs/topics/ docs/grouped/ 10
```

**Output**: Creates files like `group_1_of_5_12_files.md` containing:

```markdown
<!-- Source: topic_1.md -->

# Topic 1

Content here...

---

<!-- Source: topic_2.md -->

# Topic 2

More content...
```

## 📁 Project Structure

```
zulip_scraping/
├── zulip_scraper.js       # Browser script for scraping
├── zulip_cleaner.js       # Node.js script for cleaning data
├── data_splitter.js       # Node.js script for splitting topics
├── markdown_compactor.js  # Node.js script for grouping files
├── README.md              # This documentation
├── data/                  # Raw scraped JSON files
├── cleaned_data/          # Processed JSON files
├── markdown_files/        # Individual topic files
└── compacted/             # Grouped markdown files
```

## ⚙️ Configuration & Options

### Zulip Scraper

- Automatically detects and loads required dependencies (Turndown.js)
- Handles pagination and scrolling automatically
- Includes rate limiting to avoid overwhelming the server

### Zulip Cleaner

- Merges consecutive messages from same sender automatically
- Preserves original message formatting and line breaks
- Creates output directories automatically if they don't exist

### Data Splitter

- Sanitizes topic names for safe filenames
- Supports custom output directories
- Handles special characters and Unicode in topic names

### Markdown Compactor

- Even distribution of files across groups (by file count)
- Maintains original formatting and adds source tracking
- Horizontal rule separators between combined files
- Descriptive group filenames with statistics

## 🛠️ Troubleshooting

### Common Issues

**Scraper not working**:

- Ensure you're at the top of the channel before running
- Check that JavaScript is enabled in your browser
- Try refreshing the page and running the script again

**Missing messages**:

- Make sure to scroll to the very top of the channel before scraping
- Large channels may take several minutes to complete

**File permission errors**:

- Ensure the output directories are writable
- Run with appropriate permissions on restricted systems

**Invalid JSON errors**:

- Check that the scraped file is valid JSON
- Re-run the scraper if the file appears corrupted

**Too many individual files**:

- Use the compactor script to group files into manageable collections
- Adjust the number of groups (N) based on your needs
- Consider organizing by topic themes before compacting

## 📄 License

This project is open source. Feel free to modify and distribute as needed.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to improve the scraping pipeline.
