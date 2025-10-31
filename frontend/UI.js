// Handles popup UI interactions for Word Rewriter

console.log('Word Rewriter UI loaded');

const $ = (sel) => document.querySelector(sel);

function setStatus(msg) {
  $("#status").textContent = msg || "";
}

async function fetchSelectionFromPage() {
  const grabStatusEl = $("#grabStatus");
  grabStatusEl.textContent = "Reading selection...";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" });
    if (response && response.text) {
      $("#source").value = response.text.trim();
      grabStatusEl.textContent = `Got ${response.text.length} chars`;
    } else {
      grabStatusEl.textContent = "No text selected";
    }
  } catch {
    grabStatusEl.textContent = "Can't access page - paste manually";
  }
}

async function runProcessing() {
  const runBtn = $("#run");
  runBtn.disabled = true;
  setStatus("Processing...");

  const inputText = $("#source").value.trim();
  const tone = $("#tone").value;

  if (!inputText) {
    setStatus("Please enter some text.");
    runBtn.disabled = false;
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "PROCESS_TEXT",
      input: inputText,
      tone: tone
    });

    if (response.ok) {
      $("#output").value = response.result;
      setStatus("Done!");
    } else {
      $("#output").value = "";
      setStatus("Error: " + (response.error || "Processing failed"));
    }
  } catch (err) {
    console.error(err);
    setStatus("Error: Could not communicate with background script");
  } finally {
    runBtn.disabled = false;
  }
}

async function copyOutput() {
  try {
    await navigator.clipboard.writeText($("#output").value);
    setStatus("Copied!");
  } catch {
    setStatus("Copy failed");
  }
}
chrome.storage.sync.get(['defaultTone'], (data) => {
  if (data.defaultTone) {
    document.getElementById('tone').value = data.defaultTone;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  $("#grabSelection").addEventListener("click", fetchSelectionFromPage);
  $("#run").addEventListener("click", runProcessing);
  $("#copy").addEventListener("click", copyOutput);
});
