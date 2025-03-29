import React, { useState } from 'react';
import './App.css';

function App() {
  // State hooks for form inputs and modes
  const [rawData, setRawData] = useState('');
  const [winningNumber, setWinningNumber] = useState('');
  const [numberOfWinners, setNumberOfWinners] = useState('');
  const [tieMode, setTieMode] = useState('first'); // "first" or "all"
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
        return a.index - b.index; // tie-break by original order
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
    .join("\n");
    
  const originalDataText = winners.map(w => w.original).join("\n");

  return (
    <div className="app">
      <header className="header">
        <h1 className="app-title">Random Number Picker</h1>
        <div className="header-right">
          <div className="logo-placeholder"></div>
          <button className="reset-btn" onClick={handleReset}>
            <i className="material-icons">refresh</i> Reset
          </button>
        </div>
      </header>

      <div className="content">
        <div className="left">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="rawData">Enter One Entry Per Line (Name and Number)</label>
              <textarea 
                id="rawData" 
                value={rawData} 
                onChange={(e) => setRawData(e.target.value)}
                rows="10" 
                placeholder="John Doe 42.5&#10;Jane Smith 38.7"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="winningNumber">Winning Number</label>
              <input 
                id="winningNumber" 
                type="text" 
                value={winningNumber} 
                onChange={(e) => setWinningNumber(e.target.value)}
                placeholder="Enter the target number"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="numberOfWinners">Number of Winners</label>
              <input 
                id="numberOfWinners" 
                type="number" 
                value={numberOfWinners} 
                onChange={(e) => setNumberOfWinners(e.target.value)}
                placeholder="How many winners?"
                min="1"
                required
              />
            </div>

            <div className="advanced-toggle-field">
              <button 
                type="button" 
                className={`advanced-toggle ${advancedMode ? 'on' : 'off'}`}
                onClick={() => setAdvancedMode(!advancedMode)}
              >
                <i className="material-icons">{advancedMode ? 'toggle_on' : 'toggle_off'}</i>
                Advanced Options
              </button>
            </div>

            {/* Put tie and duplicate handling side by side */}
            <div className="inline-fields">
              <div className="field">
                <label htmlFor="tieMode">Tie Handling</label>
                <select 
                  id="tieMode" 
                  value={tieMode} 
                  onChange={(e) => setTieMode(e.target.value)}
                  disabled={!advancedMode}>
                  <option value="first">Choose First {numberOfWinners}</option>
                  <option value="all">Include All Ties</option>
                </select>
              </div>
              
              <div className="field">
                <label htmlFor="duplicateMode">Duplicate Handling</label>
                <select 
                  id="duplicateMode" 
                  value={duplicateMode} 
                  onChange={(e) => setDuplicateMode(e.target.value)}
                  disabled={!advancedMode}>
                  <option value="first">Keep First Entry</option>
                  <option value="last">Keep Last Entry</option>
                </select>
              </div>
            </div>

            <div className={`field ${!advancedMode ? 'disabled-field' : ''}`}>
              <label htmlFor="whitelist">Whitelist (allow duplicates for these names)</label>
              <textarea 
                id="whitelist" 
                value={whitelist} 
                onChange={(e) => setWhitelist(e.target.value)}
                rows="3"
                placeholder="Enter names to whitelist (comma or line separated)"
                disabled={!advancedMode}
              />
            </div>

            <button type="submit" className="pick-winners-btn">
              <i className="material-icons">emoji_events</i> Pick Winners
            </button>
          </form>
        </div>

        <div className="right">
          {/* Always show the results section */}
          <div className="results">
            <div className="output-section">
              <h2>Winners</h2>
              <textarea 
                className="output-textarea"
                readOnly
                value={winnersText}
                rows={Math.max(5, winners.length + 1)}
                placeholder="Winners will appear here"
              />
            </div>
            
            <div className="output-section">
              <h2>Original Entries</h2>
              <textarea 
                className="output-textarea"
                readOnly
                value={originalDataText}
                rows={Math.max(5, winners.length + 1)}
                placeholder="Original entries will appear here"
              />
            </div>
            
            <div className="timestamp-wrapper">
              {timestamp && <span className="timestamp">{timestamp}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;