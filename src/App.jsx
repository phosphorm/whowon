import React, { useState } from 'react';
import './App.css';

function App() {
  // State Hooks
  const [rawData, setRawData] = useState('');
  const [winningNumber, setWinningNumber] = useState('');
  const [numWinners, setNumWinners] = useState(1);
  const [tieMode, setTieMode] = useState('first');
  const [duplicateMode, setDuplicateMode] = useState('first');
  const [whitelist, setWhitelist] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [winners, setWinners] = useState([]);
  const [timestamp, setTimestamp] = useState('');

  // Function to Parse Entries
  const parseEntries = (data) => {
    return data
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, index) => {
        const match = line.match(/(.+?)\s([A-Za-z])(\d+)/);
        if (match) {
          return {
            name: `${match[1]} ${match[2]}`, // Extract "John M"
            number: parseInt(match[3], 10),  // Extract 823
            original: line,
            index,
          };
        }
        return null;
      })
      .filter((entry) => entry !== null);
  };

  // Handle Winner Selection
  const handlePickWinners = () => {
    const entries = parseEntries(rawData);
    const target = parseInt(winningNumber, 10);
    let winnersCount = parseInt(numWinners, 10);

    if (isNaN(target) || isNaN(winnersCount) || winnersCount < 1) {
      alert("Please enter valid numbers for Winning Number and Number of Winners.");
      return;
    }

    // Process whitelist
    const whitelistSet = new Set(whitelist.split(/[,\n]+/).map((name) => name.trim()));

    // Filter and Deduplicate
    const seen = {};
    const filteredEntries = [];
    entries.forEach((entry) => {
      if (whitelistSet.has(entry.name)) {
        filteredEntries.push(entry);
      } else {
        if (!(entry.name in seen)) {
          seen[entry.name] = entry;
        } else if (duplicateMode === "last") {
          seen[entry.name] = entry;
        }
      }
    });

    filteredEntries.push(...Object.values(seen));

    // Sort Entries by Distance to Target
    const sortedEntries = filteredEntries.sort((a, b) => {
      const diffA = Math.abs(a.number - target);
      const diffB = Math.abs(b.number - target);
      return diffA - diffB || a.index - b.index;
    });

    let selectedWinners = sortedEntries.slice(0, winnersCount);
    if (tieMode === "all" && selectedWinners.length > 0) {
      const lastDiff = Math.abs(selectedWinners[selectedWinners.length - 1].number - target);
      sortedEntries.forEach((entry, i) => {
        if (i >= winnersCount && Math.abs(entry.number - target) === lastDiff) {
          selectedWinners.push(entry);
        }
      });
    }

    setWinners(selectedWinners);
    setTimestamp(new Date().toLocaleString());
  };

  // Handle Reset
  const handleReset = () => {
    setRawData('');
    setWinningNumber('');
    setNumWinners(1);
    setTieMode('first');
    setDuplicateMode('first');
    setWhitelist('');
    setAdvancedMode(false);
    setWinners([]);
    setTimestamp('');
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="app-title">Closest Number Picker</h1>
        <button className="reset-btn" onClick={handleReset}>🔄 Reset</button>
      </header>

      <div className="content">
        <div className="left">
          <div className="section">
            <label>Entries Input</label>
            <textarea value={rawData} onChange={(e) => setRawData(e.target.value)} rows="10" />
          </div>
          <div className="section">
            <label>Number of Winners</label>
            <input type="number" value={numWinners} onChange={(e) => setNumWinners(e.target.value)} />
          </div>
        </div>

        <div className="right">
          <div className="section">
            <label>Winning Number</label>
            <input type="number" value={winningNumber} onChange={(e) => setWinningNumber(e.target.value)} />
          </div>

          <div className="section">
            <button className={`advanced-btn ${advancedMode ? 'active' : ''}`} onClick={() => setAdvancedMode(!advancedMode)}>
              ✔️ Advanced Mode
            </button>
          </div>

          {advancedMode && (
            <>
              <div className="inline-fields">
                <div className="section">
                  <label>Tie Handling</label>
                  <select value={tieMode} onChange={(e) => setTieMode(e.target.value)}>
                    <option value="first">First Only</option>
                    <option value="all">Include All Ties</option>
                  </select>
                </div>
                <div className="section">
                  <label>Duplicate Handling</label>
                  <select value={duplicateMode} onChange={(e) => setDuplicateMode(e.target.value)}>
                    <option value="first">Keep First Entry</option>
                    <option value="last">Keep Last Entry</option>
                  </select>
                </div>
              </div>

              <div className="section">
                <label>Whitelist Names</label>
                <textarea value={whitelist} onChange={(e) => setWhitelist(e.target.value)} rows="2" />
              </div>
            </>
          )}

          <button className="pick-btn" onClick={handlePickWinners}>🏆 Pick Winners</button>
        </div>
      </div>

      <div className="results">
        <h2>Winners</h2>
        <textarea value={winners.map(w => `:W: ${w.name} - ${w.number} :W:`).join('\n')} readOnly rows="5" />
        <h2>Original Data</h2>
        <textarea value={winners.map(w => w.original).join('\n')} readOnly rows="5" />
        <p className="timestamp">⏳ {timestamp}</p>
      </div>
    </div>
  );
}

export default App;
