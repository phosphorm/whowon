import React, { useState } from 'react';
import './App.css';

function App() {
  // State hooks for form inputs and modes
  const [rawData, setRawData] = useState('');
  const [winningNumber, setWinningNumber] = useState('');
  const [numberOfWinners, setNumberOfWinners] = useState('');
  const [tieMode, setTieMode] = useState('first');        // "first" or "all"
  const [duplicateMode, setDuplicateMode] = useState('first'); // "first" or "last"
  const [whitelist, setWhitelist] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false); // Toggle for advanced features
  const [winners, setWinners] = useState([]);
  const [timestamp, setTimestamp] = useState('');

  // Parse raw data input into structured entries
  const parseRawData = (data) => {
    return data
      .split('\n')
      .map((line, index) => ({ line: line.trim(), index }))
      .filter(item => item.line.length > 0)
      .map(({ line, index }) => {
        // Find the first number in the line (supports comma or dot as decimal)
        const match = line.match(/([-+]?[0-9]*[.,]?[0-9]+)/);
        if (match) {
          const numberValue = parseFloat(match[0].replace(',', '.'));
          // Remove the number part from the line to isolate the name
          const name = line.replace(match[0], '').trim();
          return { name, number: numberValue, original: line, index };
        }
        return null;
      })
      .filter(item => item !== null);
  };

  // Main form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    let entries = parseRawData(rawData);
    const target = parseFloat(winningNumber);
    const winnersCount = parseInt(numberOfWinners, 10);

    if (isNaN(target) || isNaN(winnersCount) || winnersCount < 1) {
      alert("Please enter valid numbers for Winning Number and Number of Winners.");
      return;
    }

    // Process whitelist: split by comma or newline
    const whitelistArray = whitelist
      .split(/[,\n]+/)
      .map(name => name.trim())
      .filter(name => name !== "");

    // Filter duplicates according to duplicateMode (except whitelisted names)
    const filteredEntries = [];
    const seen = {};
    for (const entry of entries) {
      if (whitelistArray.includes(entry.name)) {
        // Keep all entries for whitelisted names
        filteredEntries.push(entry);
      } else {
        if (!(entry.name in seen)) {
          seen[entry.name] = entry;
        } else {
          if (duplicateMode === "last") {
            // Replace with the latest entry for this name
            seen[entry.name] = entry;
          }
          // If mode is "first", do nothing (keep the first entry already seen)
        }
      }
    }
    // Add all the kept entries from seen (for non-whitelisted unique names)
    for (const name in seen) {
      filteredEntries.push(seen[name]);
    }

    // Sort entries by closeness to the target number
    const sortedEntries = filteredEntries.sort((a, b) => {
      const diffA = Math.abs(a.number - target);
      const diffB = Math.abs(b.number - target);
      if (diffA === diffB) {
        return a.index - b.index;  // tie-break by original order
      }
      return diffA - diffB;
    });

    // Determine winners based on tie mode
    let selectedWinners = sortedEntries.slice(0, winnersCount);
    if (tieMode === "all" && selectedWinners.length > 0) {
      // Include all entries that tie with the last winner's diff
      const lastDiff = Math.abs(selectedWinners[selectedWinners.length - 1].number - target);
      for (let i = winnersCount; i < sortedEntries.length; i++) {
        const diff = Math.abs(sortedEntries[i].number - target);
        if (diff === lastDiff) {
          selectedWinners.push(sortedEntries[i]);
        } else {
          break;
        }
      }
    }

    setWinners(selectedWinners);
    setTimestamp(new Date().toLocaleString());
  };

  // Reset handler to clear all fields and state
  const handleReset = () => {
    setRawData('');
    setWinningNumber('');
    setNumberOfWinners('');
    setTieMode('first');
    setDuplicateMode('first');
    setWhitelist('');
    setAdvancedMode(false);
    setWinners([]);
    setTimestamp('');
  };

  // Prepare text outputs for winners and original data (for the textareas)
  const winnersText = winners
    .map(w => `:W: ${w.name || "No Name"} - ${w.number} :W:`)
    .join("\\n");
  const originalDataText = winners.map(w => w.original).join("\\n");

  return (
    <div className="app">
      {/* Header with title, logo placeholder, and Reset button */}
      <header className="header">
        <h1 className="app-title">Closest Number Picker</h1>
        <div className="header-right">
          {/* Placeholder for an SVG logo on the right side */}
          <div className="logo-placeholder" aria-hidden="true"></div>
          {/* Reset button with refresh icon */}
          <button type="button" className="reset-btn" onClick={handleReset}>
            <span className="material-icons">refresh</span> Reset
          </button>
        </div>
      </header>

      {/* Main form content in two columns */}
      <form onSubmit={handleSubmit}>
        <div className="content">
          {/* Left Column: Entries Input and Number of Winners */}
          <div className="left">
            <div className="field">
              <label htmlFor="rawData">
                Entries Input 
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    List each entry as "Name guess" on a new line (e.g., "Alice 42").
                  </span>
                </span>
              </label>
              <textarea
                id="rawData"
                rows="6"
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder="e.g. Alice 42\nBob 100\nCharlie 77"
              />
            </div>
            <div className="field">
              <label htmlFor="numberOfWinners">
                Number of Winners 
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    How many winners to pick. If ties occur and tie handling is "All", more names may be included.
                  </span>
                </span>
              </label>
              <input
                id="numberOfWinners"
                type="number"
                value={numberOfWinners}
                onChange={(e) => setNumberOfWinners(e.target.value)}
                placeholder="Enter number of winners"
                min="1"
              />
            </div>
          </div>

          {/* Right Column: Winning Number, Advanced options, and Submit button */}
          <div className="right">
            <div className="field">
              <label htmlFor="winningNumber">
                Winning Number 
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    The target number to compare guesses against.
                  </span>
                </span>
              </label>
              <input
                id="winningNumber"
                type="number"
                value={winningNumber}
                onChange={(e) => setWinningNumber(e.target.value)}
                placeholder="Enter winning number"
              />
            </div>

            {/* Advanced Mode Toggle */}
            <div className="field advanced-toggle-field">
              <button
                type="button"
                className={`advanced-toggle ${advancedMode ? 'on' : 'off'}`}
                onClick={() => setAdvancedMode(!advancedMode)}
                aria-pressed={advancedMode}
              >
                <span className="material-icons">
                  {advancedMode ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                Advanced Mode
              </button>
            </div>

            {/* Tie and Duplicate Handling (Advanced Options) */}
            <div className="inline-fields">
              <div 
                className={`field ${!advancedMode ? 'disabled-field tooltip' : ''}`}
              >
                <label htmlFor="tieMode">
                  Tie Handling
                </label>
                {/* Dropdown or radio options for tie handling */}
                <select
                  id="tieMode"
                  value={tieMode}
                  onChange={(e) => setTieMode(e.target.value)}
                  disabled={!advancedMode}
                >
                  <option value="first">First Only</option>
                  <option value="all">Include All Ties</option>
                </select>
                {!advancedMode && (
                  <span className="tooltiptext">Enable Advanced Mode to use this feature</span>
                )}
              </div>
              <div 
                className={`field ${!advancedMode ? 'disabled-field tooltip' : ''}`}
              >
                <label htmlFor="duplicateMode">
                  Duplicate Handling
                </label>
                <select
                  id="duplicateMode"
                  value={duplicateMode}
                  onChange={(e) => setDuplicateMode(e.target.value)}
                  disabled={!advancedMode}
                >
                  <option value="first">Keep First Entry</option>
                  <option value="last">Keep Last Entry</option>
                </select>
                {!advancedMode && (
                  <span className="tooltiptext">Enable Advanced Mode to use this feature</span>
                )}
              </div>
            </div>

            {/* Whitelist Input (Advanced Option) */}
            <div className={`field ${!advancedMode ? 'disabled-field tooltip' : ''}`}>
              <label htmlFor="whitelist">
                Whitelist Names 
              </label>
              <textarea
                id="whitelist"
                rows="2"
                value={whitelist}
                onChange={(e) => setWhitelist(e.target.value)}
                placeholder="e.g. Alice, Bob"
                disabled={!advancedMode}
              />
              {!advancedMode && (
                <span className="tooltiptext">Enable Advanced Mode to use this feature</span>
              )}
            </div>

            {/* Submit/Pick Winners Button */}
            <button type="submit" className="pick-winners-btn">
              <span className="material-icons">military_tech</span> {/* an icon for winning, e.g., medal */}
              Pick Winners
            </button>
          </div>
        </div>
      </form>

      {/* Results Section: Winners and Original Data outputs (shown after submission) */}
      {winners.length > 0 && (
        <div className="results">
          <div className="output-section">
            <h2>Winners</h2>
            <p><strong>Timestamp:</strong> {timestamp}</p>
            <label htmlFor="winnersOutput">Winners Output:</label>
            <textarea
              id="winnersOutput"
              className="output-textarea"
              readOnly
              rows="5"
              value={winnersText}
            />
          </div>
          <div className="output-section">
            <h2>Original Data</h2>
            <label htmlFor="originalOutput">Original Data for Winners:</label>
            <textarea
              id="originalOutput"
              className="output-textarea"
              readOnly
              rows="5"
              value={originalDataText}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;