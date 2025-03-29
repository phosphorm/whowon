import React, { useState } from 'react';
import './App.css';

function App() {
  const [rawInput, setRawInput] = useState('');
  const [target, setTarget] = useState('');
  const [numWinners, setNumWinners] = useState(1);
  const [tieMode, setTieMode] = useState('first');
  const [dupMode, setDupMode] = useState('first');
  const [whitelist, setWhitelist] = useState('');
  const [winners, setWinners] = useState([]);
  const [message, setMessage] = useState('No winners yet. Enter data and click Calculate.');

  const handleCalculate = () => {
    // Split raw input into non-empty lines
    const lines = rawInput.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length === 0) {
      setWinners([]);
      setMessage('No entries provided.');
      return;
    }
    // Parse each line into { name, guess, origIndex }
    const entries = [];
    lines.forEach((line, idx) => {
      // Assume last token is the numeric guess, rest is the name
      const parts = line.split(/\s+/);
      if (parts.length < 2) return; // skip if not enough parts
      let guess = parseFloat(parts[parts.length - 1]);
      if (isNaN(guess)) {
        // If last part isn’t a number, try to extract a number from the line
        const match = line.match(/[-+]?\d*\.?\d+$/);
        if (match) {
          guess = parseFloat(match[0]);
          const namePart = line.slice(0, line.lastIndexOf(match[0]));
          const name = namePart.replace(/[,:-\s]+$/, ''); // trim trailing separators
          if (name) {
            entries.push({ name: name, guess: guess, origIndex: idx });
          }
        }
      } else {
        const name = parts.slice(0, -1).join(' ').replace(/[,:-\s]+$/, '');
        if (name) {
          entries.push({ name: name, guess: guess, origIndex: idx });
        }
      }
    });
    if (entries.length === 0) {
      setWinners([]);
      setMessage('No valid entries found.');
      return;
    }
    // Validate target number
    const targetNum = parseFloat(target);
    if (isNaN(targetNum)) {
      setWinners([]);
      setMessage('Please enter a valid target number.');
      return;
    }
    // Validate number of winners (minimum 1)
    let winnersCount = parseInt(numWinners, 10);
    if (isNaN(winnersCount) || winnersCount < 1) {
      winnersCount = 1;
    }
    // Prepare whitelist set of names
    const whitelistNames = whitelist.split(/[,\n]+/).map(name => name.trim()).filter(name => name);
    const whitelistSet = new Set(whitelistNames);

    // Apply duplicate-name handling
    const filteredEntries = [];
    if (dupMode === 'first') {
      const seenNames = new Set();
      entries.forEach(entry => {
        if (whitelistSet.has(entry.name)) {
          // Keep all entries for whitelisted names
          filteredEntries.push(entry);
        } else if (!seenNames.has(entry.name)) {
          seenNames.add(entry.name);
          filteredEntries.push(entry);
        }
        // If name already seen and not whitelisted, skip the entry
      });
    } else if (dupMode === 'last') {
      const seenNames = new Set();
      const reversedToKeep = [];
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (whitelistSet.has(entry.name)) {
          reversedToKeep.push(entry);
        } else if (!seenNames.has(entry.name)) {
          seenNames.add(entry.name);
          reversedToKeep.push(entry);
        }
        // If name already seen and not whitelisted, skip earlier entry
      }
      reversedToKeep.reverse(); // restore original order for kept entries
      filteredEntries.push(...reversedToKeep);
    } else {
      // If an unexpected mode, default to using all entries
      filteredEntries.push(...entries);
    }

    if (filteredEntries.length === 0) {
      setWinners([]);
      setMessage('No entries remaining after applying duplicate filter.');
      return;
    }
    // Calculate difference from target for each entry
    filteredEntries.forEach(entry => {
      entry.diff = Math.abs(entry.guess - targetNum);
    });
    // Sort by diff ascending; tie-break by original input order
    filteredEntries.sort((a, b) => {
      if (a.diff !== b.diff) {
        return a.diff - b.diff;
      } else {
        return a.origIndex - b.origIndex;
      }
    });
    // Clamp number of winners to available entries
    if (winnersCount > filteredEntries.length) {
      winnersCount = filteredEntries.length;
    }
    // Select top N entries as winners
    let selected = filteredEntries.slice(0, winnersCount);
    // If tie mode is 'all', include all entries tying with the last winner’s diff
    if (selected.length > 0 && tieMode === 'all') {
      const cutoffDiff = selected[selected.length - 1].diff;
      for (let i = winnersCount; i < filteredEntries.length; i++) {
        if (filteredEntries[i].diff === cutoffDiff) {
          selected.push(filteredEntries[i]);
        } else {
          break;
        }
      }
    }
    setWinners(selected);
    setMessage(selected.length > 0 ? '' : 'No winners found.');
  };

  return (
    <div className="app">
      <h1>Closest Number Winners Picker</h1>
      <div className="content">
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
              rows="6" 
              value={rawInput} 
              onChange={e => setRawInput(e.target.value)}
              placeholder={"e.g.\nAlice 42\nBob 100\nCharlie 77"} />
          </div>
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
              placeholder="Enter target" />
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
              value={numWinners} 
              onChange={e => setNumWinners(e.target.value)} 
              min="1" step="1" 
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
          <button className="calculate-btn" onClick={handleCalculate}>
            Calculate Winners
          </button>
        </div>
        <div className="right">
          <div className="output-box">
            <h2>Winners</h2>
            {winners.length > 0 ? (
              <ul>
                {winners.map((entry, index) => {
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
