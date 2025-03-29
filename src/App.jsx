import React, { useState } from "react";
import "./App.css";

function App() {
  // State for inputs, options, and results
  const [rawInput, setRawInput] = useState("");
  const [target, setTarget] = useState("");
  const [numWinners, setNumWinners] = useState(1);
  const [tieMode, setTieMode] = useState("first");
  const [dupMode, setDupMode] = useState("first");
  const [whitelist, setWhitelist] = useState("");
  const [winners, setWinners] = useState([]);
  const [message, setMessage] = useState("No winners yet. Enter data and click Calculate.");
  const [timestamp, setTimestamp] = useState("");

  // Handle the main calculation logic
  const handleCalculate = () => {
    // Parse raw input lines into entries { name, guess, origIndex, original }
    const lines = rawInput.split("\n").map(line => line.trim()).filter(line => line);
    if (lines.length === 0) {
      setWinners([]);
      setMessage("No entries provided.");
      return;
    }
    const entries = [];
    lines.forEach((line, idx) => {
      const parts = line.split(/\s+/);
      if (parts.length < 2) return;  // skip lines without at least name and number
      let guess = parseFloat(parts[parts.length - 1]);
      if (isNaN(guess)) {
        // If last token isn't a number, attempt to find a trailing number in the line
        const match = line.match(/[-+]?\d*\.?\d+$/);
        if (match) {
          guess = parseFloat(match[0]);
          const namePart = line.slice(0, line.lastIndexOf(match[0]));
          const name = namePart.replace(/[,:-\s]+$/, "");
          if (name) {
            entries.push({ name: name, guess: guess, origIndex: idx, original: line });
          }
        }
      } else {
        const name = parts.slice(0, -1).join(" ").replace(/[,:-\s]+$/, "");
        if (name) {
          entries.push({ name: name, guess: guess, origIndex: idx, original: line });
        }
      }
    });
    if (entries.length === 0) {
      setWinners([]);
      setMessage("No valid entries found.");
      return;
    }
    // Validate target number and number of winners
    const targetNum = parseFloat(target);
    if (isNaN(targetNum)) {
      setWinners([]);
      setMessage("Please enter a valid target number.");
      return;
    }
    let winnersCount = parseInt(numWinners, 10);
    if (isNaN(winnersCount) || winnersCount < 1) winnersCount = 1;

    // Prepare whitelist set for names to always include
    const whitelistNames = whitelist.split(/[,\n]+/).map(name => name.trim()).filter(name => name);
    const whitelistSet = new Set(whitelistNames);

    // Apply duplicate handling (filter entries by name)
    const filteredEntries = [];
    if (dupMode === "first") {
      const seenNames = new Set();
      entries.forEach(entry => {
        if (whitelistSet.has(entry.name)) {
          // Always include whitelisted names' entries
          filteredEntries.push(entry);
        } else if (!seenNames.has(entry.name)) {
          seenNames.add(entry.name);
          filteredEntries.push(entry);
        }
        // If name seen again and not whitelisted, skip (keep first instance)
      });
    } else {  // dupMode === "last"
      const latestEntry = {};
      entries.forEach(entry => {
        if (whitelistSet.has(entry.name)) {
          filteredEntries.push(entry);
        } else {
          // Keep replacing to end up with the last entry for each name
          latestEntry[entry.name] = entry;
        }
      });
      // Add all last entries for non-whitelisted names
      Object.values(latestEntry).forEach(entry => filteredEntries.push(entry));
    }
    if (filteredEntries.length === 0) {
      setWinners([]);
      setMessage("No entries remaining after applying duplicate filter.");
      return;
    }

    // Calculate difference from target for each entry
    filteredEntries.forEach(entry => {
      entry.diff = Math.abs(entry.guess - targetNum);
    });
    // Sort by smallest diff (ties broken by original input order)
    filteredEntries.sort((a, b) => {
      if (a.diff !== b.diff) return a.diff - b.diff;
      return a.origIndex - b.origIndex;
    });

    // Select the top N winners
    let selected = filteredEntries.slice(0, winnersCount);
    // Tie handling: include all tied entries if mode is "all"
    if (selected.length > 0 && tieMode === "all") {
      const cutoffDiff = selected[selected.length - 1].diff;
      for (let i = winnersCount; i < filteredEntries.length; i++) {
        if (filteredEntries[i].diff === cutoffDiff) {
          selected.push(filteredEntries[i]);
        } else {
          break;
        }
      }
    }

    // Update state with results and timestamp
    setWinners(selected);
    setMessage(selected.length > 0 ? "" : "No winners found.");
    setTimestamp(new Date().toLocaleString());
  };

  // Reset all fields and outputs
  const handleReset = () => {
    setRawInput("");
    setTarget("");
    setNumWinners(1);
    setTieMode("first");
    setDupMode("first");
    setWhitelist("");
    setWinners([]);
    setMessage("No winners yet. Enter data and click Calculate.");
    setTimestamp("");
  };

  return (
    <div className="app">
      <h1>Closest Number Picker</h1>
      <div className="content">
        {/* Left column: Entries Input */}
        <div className="left">
          <div className="field">
            <label htmlFor="rawInput">
              Entries Input 
              <span className="tooltip">ℹ️
                <span className="tooltiptext">
                  List of name and number guesses, one per line (e.g. "Alice 42")
                </span>
              </span>
            </label>
            <textarea 
              id="rawInput"
              rows="10"
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder={"e.g.\nAlice 42\nBob 100\nCharlie 77"} />
          </div>
        </div>

        {/* Right column: Controls and Results */}
        <div className="right">
          {/* Tie & Duplicate handling options are side-by-side in this config box */}
          <div className="config-box">
            <div className="field">
              <label htmlFor="target">
                Target Number 
                <span className="tooltip">ℹ️
                  <span className="tooltiptext">The target number to compare guesses against</span>
                </span>
              </label>
              <input 
                id="target"
                type="number"
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="Enter target number" />
            </div>
            <div className="field">
              <label htmlFor="numWinners">
                Number of Winners 
                <span className="tooltip">ℹ️
                  <span className="tooltiptext">
                    How many winners to pick (tied winners are included if tie handling is "all")
                  </span>
                </span>
              </label>
              <input 
                id="numWinners"
                type="number"
                min="1" 
                step="1"
                value={numWinners}
                onChange={e => setNumWinners(e.target.value)}
                placeholder="1" />
            </div>
            <div className="inline-fields">
              <div className="field">
                <label htmlFor="tieMode">
                  Tie Handling 
                  <span className="tooltip">ℹ️
                    <span className="tooltiptext">
                      If multiple guesses are equally close, pick only the first one (input order) or include all tied entries
                    </span>
                  </span>
                </label>
                <select 
                  id="tieMode"
                  value={tieMode}
                  onChange={e => setTieMode(e.target.value)}>
                  <option value="first">First Only</option>
                  <option value="all">Include All Ties</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="dupMode">
                  Duplicate Handling 
                  <span className="tooltip">ℹ️
                    <span className="tooltiptext">
                      If a name has multiple entries, keep either their first entry or their last entry
                    </span>
                  </span>
                </label>
                <select 
                  id="dupMode"
                  value={dupMode}
                  onChange={e => setDupMode(e.target.value)}>
                  <option value="first">Keep First Entry</option>
                  <option value="last">Keep Last Entry</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="whitelist">
                Whitelist Names 
                <span className="tooltip">ℹ️
                  <span className="tooltiptext">
                    Names (comma or newline separated) whose entries should always be kept (no duplicate removal)
                  </span>
                </span>
              </label>
              <textarea 
                id="whitelist"
                rows="2"
                value={whitelist}
                onChange={e => setWhitelist(e.target.value)}
                placeholder="e.g. Alice, Bob" />
            </div>
            <button className="calculate-btn" onClick={handleCalculate}>Calculate Winners</button>
            <button className="reset-btn" type="button" onClick={handleReset}>Reset</button>
          </div>

          <div className="output-box">
            <h2>Winners</h2>
            {winners.length > 0 ? (
              <ul>
                {winners.map((entry, index) => {
                  // Display diff with at most 2 decimal places if not integer
                  const diffDisplay = Number.isInteger(entry.diff) ? entry.diff : entry.diff.toFixed(2);
                  return (
                    <li key={index}>
                      {entry.name} – {entry.guess}
                      {entry.diff !== undefined && ` (Diff: ${diffDisplay})`}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="no-winners">{message}</p>
            )}
            {winners.length > 0 && (
              <>
                <h2>Original Data</h2>
                <ul>
                  {winners.map((entry, idx) => (
                    <li key={idx}>{entry.original}</li>
                  ))}
                </ul>
              </>
            )}
            <div className="timestamp">
              {timestamp && `Timestamp: ${timestamp}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;