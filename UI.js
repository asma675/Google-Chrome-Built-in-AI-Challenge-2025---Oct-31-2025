/* UI.js — Popup logic (Asma)
 * This script only handles UI events and messaging.
 * It sends requests to the background (backendLogic.js/api.js) and to the content script
 * to grab the current page selection.
 */

const $ = (sel) => document.querySelector(sel);
const statusEl = $("#status");
const outputEl = $("#output");
const sourceEl = $("#source");
const grabStatusEl = $("#grabStatus");

function setStatus(msg) {
  statusEl.textContent = msg ?? "";
}

function setGrabStatus(msg) {
  grabStatusEl.textContent = msg ?? "";
}

function withLoading(el, isLoading) {
  if (isLoading) {
    el.setAttribute("data-loading", "true");
    el.disabled = true;
  } else {
    el.removeAttribute("data-loading");
    el.disabled = false;
  }
}

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs?.[0]?.id;
}

// Ask the content script for the current selection.
async function fetchSelectionFromPage() {
  setGrabStatus("Reading selection…");
  try {
    const tabId = await getActiveTabId();
    if (!tabId) throw new Error("No active tab");

    const response = await chrome.tabs.sendMessage(tabId, { type: "GET_SELECTION" });
    if (!response || !response.text) {
      setGrabStatus("No selection found. Paste code manually.");
      return;
    }
    sourceEl.value = response.text.trim();
    setGrabStatus(`Got ${response.text.length} chars from page selection.`);
  } catch (err) {
    setGrabStatus("Couldn’t access selection. Make sure the page is loaded and the extension is allowed.");
    console.debug(err);
  }
}

// Send the processing request to background.
async function runProcessing() {
  const runBtn = $("#run");
  withLoading(runBtn, true);
  setStatus("Processing…");

  const payload = {
    type: "PROCESS_TEXT",
    input: sourceEl.value,
    mode: $("#mode").value,
    tone: $("#tone").value,
    detail: $("#detail").value,
    audience: $("#audience").value,
    language: $("#language").value.trim() || null,
    includeExamples: $("#includeExamples").checked,
  };

  if (!payload.input || payload.input.trim().length < 2) {
    setStatus("Please paste code or use page selection.");
    withLoading(runBtn, false);
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage(payload);
    if (response?.ok) {
      outputEl.value = response.result;
      setStatus("Done.");
    } else {
      outputEl.value = "";
      setStatus(response?.error || "Something went wrong. Check the console.");
    }
  } catch (err) {
    console.error(err);
    setStatus("Failed to communicate with background.");
  } finally {
    withLoading(runBtn, false);
  }
}

// Copy output to clipboard.
async function copyOutput() {
  try {
    await navigator.clipboard.writeText(outputEl.value || "");
    setStatus("Copied to clipboard.");
  } catch {
    setStatus("Copy failed.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("#grabSelection").addEventListener("click", fetchSelectionFromPage);
  $("#run").addEventListener("click", runProcessing);
  $("#copy").addEventListener("click", copyOutput);
  $("#openDocs").href = "https://example.com/docs"; // note rmbr to replace with real docs link
});
