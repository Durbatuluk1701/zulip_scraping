function loadTurndownScript() {
  return new Promise((resolve, reject) => {
    // Check if TurndownService is already available
    if (typeof TurndownService !== 'undefined') {
      console.log('TurndownService is already loaded.');
      resolve(); // Resolve immediately if already loaded
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/turndown/dist/turndown.js'; // Turndown CDN URL

    script.onload = () => {
      if (typeof TurndownService !== 'undefined') {
        console.log('TurndownService loaded successfully!');
        resolve();
      } else {
        console.error('Turndown script loaded, but TurndownService is not defined. Check the library or CDN link.');
        reject(new Error('TurndownService not defined after script load.'));
      }
    };

    script.onerror = () => {
      console.error('Failed to load the TurndownService script. Check network or CSP.');
      reject(new Error('Failed to load TurndownService script.'));
    };

    document.head.appendChild(script);
    console.log('Attempting to load TurndownService from CDN...');
  });
}

/**
* Saves a JavaScript object to a local file as JSON by triggering a browser download.
*
* @param {object} objectToSave The JavaScript object you want to save.
* @param {string} [filename='data.json'] The desired name for the downloaded file.
*/
function saveObjectAsJsonFile(objectToSave, filename) {
  // Set default filename if not provided
  const effectiveFilename = filename || 'data.json';

  // 1. Convert object to JSON string
  // Using null for the replacer function and 2 for space argument to pretty-print the JSON.
  let jsonString;
  try {
    jsonString = JSON.stringify(objectToSave, null, 2);
    if (typeof jsonString === 'undefined') {
      // Handle cases where objectToSave might be, e.g., a lone undefined or a function
      console.warn("The object to save stringified to 'undefined'. Saving as 'null'.");
      jsonString = "null";
    }
  } catch (error) {
    console.error("Error stringifying the object:", error);
    return; // Exit if stringification fails
  }

  // 2. Create a Blob with the JSON string
  const blob = new Blob([jsonString], { type: 'application/json' });

  // 3. Create an Object URL for the Blob
  const url = URL.createObjectURL(blob);

  // 4. Create a temporary anchor element
  const a = document.createElement('a');
  a.href = url;
  a.download = effectiveFilename; // This attribute suggests the filename to the browser

  // 5. Append to body, simulate click, and then remove
  document.body.appendChild(a);
  a.click();

  // 6. Clean up: Revoke the object URL and remove the anchor element
  // It's good practice to do this in a timeout to ensure the download has time to initiate
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`Download initiated for "${effectiveFilename}".`);
  }, 150); // A short delay
}

/**
 * Transforms a single Zulip code block DOM element into a standard <pre><code> element.
 * Does not modify the input element.
 *
 * @param {Element} zulipBlockElement - The DOM element for a 'div.codehilite.zulip-code-block'.
 * @returns {Element|null} A new <pre> element with the transformed code, or null if transformation fails.
 */
function transformSingleZulipCodeBlockToElement(zulipBlockElement) {
  if (!zulipBlockElement || typeof zulipBlockElement.getAttribute !== 'function') {
    // console.warn('Invalid input to transformSingleZulipCodeBlockToElement, not an element.');
    return null;
  }

  const language = zulipBlockElement.getAttribute('data-code-language');
  const preTag = zulipBlockElement.querySelector('pre'); // Find <pre> within the given block

  if (!preTag) {
    // console.warn('Zulip code block provided does not contain a <pre> tag.', zulipBlockElement);
    return null; // Cannot transform if essential structure is missing
  }

  const codeTag = preTag.querySelector('code'); // Find <code> within that <pre>

  if (!codeTag) {
    // console.warn('Zulip code block <pre> tag does not contain a <code> tag.', preTag);
    return null; // Cannot transform if essential structure is missing
  }

  const rawCode = codeTag.textContent;

  // Create new elements in memory
  const newPreElement = document.createElement('pre');
  const newCodeElement = document.createElement('code');

  if (language) {
    newCodeElement.className = 'language-' + language.toLowerCase().trim();
  }
  newCodeElement.textContent = rawCode;
  newPreElement.appendChild(newCodeElement);

  return newPreElement; // Return the new <pre> DOM Element
}

/**
 * Takes an original message DOM element, clones it, transforms all Zulip code blocks
 * within the clone to a standard format, and returns the innerHTML of the processed clone.
 *
 * @param {Element} originalMessageElement - The original DOM element for the message block.
 * @returns {string} The innerHTML string of the cloned and processed message block.
 */
function getPreprocessedMessageHtml(originalMessageElement) {
  if (!originalMessageElement || typeof originalMessageElement.cloneNode !== 'function') {
    console.error("Invalid input to getPreprocessedMessageHtml: not a DOM element.", originalMessageElement);
    // Depending on how you want to handle errors, you could return original innerHTML or an empty string
    return originalMessageElement && originalMessageElement.innerHTML ? originalMessageElement.innerHTML : "";
  }
  const clonedMessageElement = originalMessageElement.cloneNode(true);

  // Find Zulip code blocks *within the cloned element*
  // QuerySelectorAll on the cloned element ensures we only affect the clone.
  const zulipCodeBlocksInClone = clonedMessageElement.querySelectorAll('div.codehilite.zulip-code-block');

  zulipCodeBlocksInClone.forEach(blockInClone => {
    const newStandardCodeElement = transformSingleZulipCodeBlockToElement(blockInClone);

    if (newStandardCodeElement && blockInClone.parentNode) {
      // Replace the original Zulip code block (in the clone) with the new standard one
      blockInClone.parentNode.replaceChild(newStandardCodeElement, blockInClone);
    } else if (!newStandardCodeElement) {
      // Optional: log if a specific block couldn't be transformed
      // console.warn("Could not transform a Zulip code block within the cloned message; leaving as is.", blockInClone);
    }
  });

  return clonedMessageElement.innerHTML;
}


/**
 * Simulates a "jiggle" scroll on the main window (scrolls up by a fraction of viewport height, then back down).
 * @param {number} [fraction=1/8] - The fraction of the viewport height to scroll by (e.g., 1/8, 0.1).
 */
async function simulateWindowJiggleScroll(fraction = 1 / 8) {
  const viewportHeight = window.innerHeight;
  const scrollAmount = Math.round(viewportHeight * fraction);

  if (scrollAmount === 0) {
    console.log("Calculated scroll amount is 0. No scroll will occur. Viewport height might be too small or fraction too low.");
    return;
  }

  // Scroll Up
  window.scrollBy({ top: -scrollAmount, behavior: 'auto' });
  // Wait for the next frame to ensure the scroll has been processed by the rendering engine
  await new Promise(resolve => requestAnimationFrame(resolve));

  // Scroll Down (back by the same amount)
  console.log(`Jiggle: Scrolling window down by ${scrollAmount}px...`);
  window.scrollBy({ top: scrollAmount, behavior: 'auto' });
  await new Promise(resolve => requestAnimationFrame(resolve));

  // Note: Due to scroll clamping at the document's top or bottom,
  // the final scrollY might not be exactly the originalScrollY if the scroll started near an edge.
}

const overall_stuff = {}

async function rest() {
  // Ensure the helper functions (transformSingleZulipCodeBlockToElement, getPreprocessedMessageHtml)
  // are defined in your console environment first.

  const turndownService = new TurndownService({
    headingStyle: 'atx',   // e.g. ### Heading
    codeBlockStyle: 'fenced' // e.g. ```javascript
  });

  // while we can still find a "trailed_bookend" element, we need to continue scrolling
  // bookend_selector = "#message-lists-container .trailing_bookend";
  const bookend_selector = "#bottom_whitespace";
  const row_selector = "#message-lists-container .recipient_row";

  // random garbage
  let prev_last_row_id = "random_name_picked_for_something_that_will_never_be_a_row_id";
  let processed_rows = [];
  let bookend = document.querySelector(bookend_selector);

  async function processRows() {

    await simulateWindowJiggleScroll(1 / 8) // Simulate a jiggle scroll to trigger loading more rows

    // wait for 1 second to ensure the page has loaded new rows
    await new Promise(resolve => setTimeout(resolve, 1000));

    let rows = Array.from(document.querySelectorAll(row_selector));
    // Presume that if we are starting here, we always have some rows to look at
    if (!rows || rows.length === 0) {
      console.warn("No rows found in the message list. Exiting scroll loop.");
      return; // Exit if no rows are found
    }
    const cur_row_ids = rows.map(row => row.id);
    console.log("Previously processed rows:", processed_rows);
    console.log(`Processing ${rows.length} rows: {${cur_row_ids.join(', ')}}`);

    if (cur_row_ids.reduce((acc, id) => acc && processed_rows.includes(id), true)) {
      console.warn("No new rows found since the last check. Exiting scroll loop.");
      return; // Exit if no new rows are found
    }

    // Otherwise, something new to process
    rows.forEach(row => {
      const id = row.id;
      if (!id) {
        console.error("Row with no ID found, skipping:", row);
        return; // Skip this row if it has no ID
      }

      if (processed_rows.includes(id)) {
        console.warn("Skipping row with ID:", row.id, "as it has already been processed.");
        return; // Skip this row if it has already been processed
      }

      // Look for a Show More buttons and click them if they exist
      const show_more_selector = "div.message_length_controller > button";
      const showMoreButtons = Array.from(row.querySelectorAll(show_more_selector));
      if (showMoreButtons) {
        console.log("Clicking 'Show More' button to expand message content.");
        showMoreButtons.forEach(button => {
          if (button.textContent.includes("Show more")) {
            button.click();
          }
        });
      }
      // one stream topic per row,
      const topic = row.querySelector(".stream-topic-inner").textContent
      if (!topic) {
        console.error("No topic found in row with ID:", id);
        return; // Skip this row if no topic is found
      }

      // multiple messages per row, so we need to get all of them
      const message_rows = Array.from(row.querySelectorAll(".message_row"));

      // Now, we place into the overall_stuff_object for the topic
      if (!overall_stuff[topic]) {
        overall_stuff[topic] = [];
      }

      previous_sender = undefined;
      // now, for each row, we need to get 1. the sender, 2. the content
      for (const message_row of message_rows) {
        const sender = message_row.querySelector(".sender_name");
        let cur_sender = sender ? sender.textContent.trim() : (previous_sender ? previous_sender : "Unknown Sender");
        previous_sender = cur_sender; // Update previous sender for next iteration
        const message_content = message_row.querySelector(".message_content");
        const processed_content = turndownService.turndown(getPreprocessedMessageHtml(message_content));
        // Now, we only want to add if it is not already in.
        if (overall_stuff[topic].some(item => item.sender === cur_sender && item.content === processed_content)) {
          console.warn("Skipping duplicate message for sender:", cur_sender, "in topic:", topic);
          return;
        }
        overall_stuff[topic] = overall_stuff[topic].concat({ "sender": cur_sender, "content": processed_content });
      }
    })

    // After processing all visible rows, we scroll, then setup the next set of rows
    const last_row = rows[rows.length - 1];
    console.log("Last row ID:", last_row.id);
    if (last_row.id === prev_last_row_id) {
      console.error("Last row ID has not changed, indicating we might be at the end of the scrollable area. Exiting scroll loop.");
      return; // Exit if the last row ID hasn't changed, indicating no new rows are loaded
    }
    prev_last_row_id = last_row.id; // Update the previous last row ID

    processed_rows = processed_rows.concat(cur_row_ids); // Update processed rows with current IDs

    bookend.scrollIntoView();
    // Wait for scroll to complete, then rec call
    const waitTime = 5000;
    console.log(`Waiting ${waitTime}ms for scroll to complete...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    console.log("Scroll completed, fetching new rows...");
    await processRows(); // Recursively call to process the next set of rows
  }
  await processRows(); // Start processing rows

  // Save the overall_stuff object to a JSON file
  saveObjectAsJsonFile(overall_stuff, 'zulip_messages.json');
  console.log("All Zulip messages have been processed and saved to zulip_messages.json.");
}

loadTurndownScript()
  .then(() => {
    // TurndownService is now available here!
    console.log('You can now use TurndownService.');
    rest(); // Call your function to process the Zulip code blocks

  })
  .catch(error => {
    console.error('An error occurred:', error);
  });
