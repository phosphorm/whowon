import React, { useState } from "react";
import "./App.css";

function App() {
  const [rawData, setRawData] = useState("");
  const [winningNumber, setWinningNumber] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState("");
  const [tieMode, setTieMode] = useState("first");       // "first" or "all"
  const [duplicateMode, setDuplicateMode] = useState("first"); // "first" or "last"
  const [whitelist, setWhitelist] = useState("");
  const [winners, setWinners] = useState([]);
  const [timestamp, setTimestamp] = useState("");

  // Parse raw data lines into objects with name, number, original text, and index
  const parseRawData = (data) => {
    return data
      .split("\n")
      .map((line, index) => ({ line: line.trim(), index }))
      .filter(item => item.line.length > 0)
      .map(({ line, index }) => {
        // Extract the first number-like pattern in the line (supports comma or dot as decimal)
        const match = line.match(/([-+]?[0-9]*[.,]?[0-9]+)/);
        if (match) {
          const numberValue = parseFloat(match[0].replace(",", "."));
          // Remove the number from the line to isolate the name
          const name = line.replace(match[0], "").trim();
          return { name, number: numberValue, original: line, index };
        }
        return null;
      })
      .filter(item => item !== null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let entries = parseRawData(rawData);
    const target = parseFloat(winningNumber);
    const winnersCount = parseInt(numberOfWinners, 10);

    if (isNaN(target) || isNaN(winnersCount) || winnersCount < 1) {
      alert("Please enter valid numbers for Winning Number and Number of Winners.");
      return;
    }

    // Prepare whitelist array
    const whitelistArray = whitelist
      .split(",")
      .map(name => name.trim())
      .filter(name => name !== "");

    // Filter duplicates (except whitelisted)
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
            // replace with the later entry if mode is "last"
            seen[entry.name] = entry;
          }
          // if mode is "first", do nothing (keep the first occurrence)
        }
      }
    }
    // Add back the unique entries for non-whitelisted names
    for (const name in seen) {
      filteredEntries.push(seen[name]);
    }

    // Sort entries by closeness to the target number
    const sortedEntries = filteredEntries.sort((a, b) => {
      const diffA = Math.abs(a.number - target);
      const diffB = Math.abs(b.number - target);
      if (diffA === diffB) {
        return a.index - b.index;
      }
      return diffA - diffB;
    });

    let selectedWinners = [];
    if (tieMode === "first") {
      // Take the top N entries as winners
      selectedWinners = sortedEntries.slice(0, winnersCount);
    } else if (tieMode === "all") {
      // Take top N, then include any additional entries tied with the Nth entry
      selectedWinners = sortedEntries.slice(0, winnersCount);
      if (selectedWinners.length > 0) {
        const thresholdDiff = Math.abs(selectedWinners[selectedWinners.length - 1].number - target);
        for (let i = winnersCount; i < sortedEntries.length; i++) {
          if (Math.abs(sortedEntries[i].number - target) === thresholdDiff) {
            selectedWinners.push(sortedEntries[i]);
          } else {
            break;
          }
        }
      }
    }

    setWinners(selectedWinners);
    setTimestamp(new Date().toLocaleString());
  };

  const handleReset = () => {
    setRawData("");
    setWinningNumber("");
    setNumberOfWinners("");
    setTieMode("first");
    setDuplicateMode("first");
    setWhitelist("");
    setWinners([]);
    setTimestamp("");
  };

  // Prepare output text for winners and their original data
  const winnersText = winners
    .map(w => `:W: ${w.name || "No Name"} - ${w.number} :W:`)
    .join("\n");
  const originalDataText = winners.map(w => w.original).join("\n");

  // Prepare output for name + difference
  const differencesText = winners
    .map(w => {
      const diff = Math.abs(w.number - parseFloat(winningNumber));
      return `Name: ${w.name || "No Name"}, Difference: ${diff}`;
    })
    .join("\n");

  return (
    <div className="app">
      {/* Sticky Header */}
      <header className="header">
        <div className="header-left">Closest Number Picker</div>
        <div className="header-right">
          {/* Placeholder for navigation or info on the right side */}
        </div>
      </header>

      {/* Main content area */}
      <main className="content">
        {/* Input Panel (left side) */}
        <div className="left panel">
          <h1>Inputs</h1>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="rawData">
                Raw Data 
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    Enter one entry per line: each line should contain a name and a number.
                  </span>
                </span>
              </label>
              <textarea
                id="rawData"
                rows="8"
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder="Paste your raw data here (one name and number per line)..."
              />
            </div>

            <div className="field">
              <label htmlFor="winningNumber">
                Winning Number 
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    The target number to compare against (closest entries will win).
                  </span>
                </span>
              </label>
              <input
                id="winningNumber"
                type="text"
                value={winningNumber}
                onChange={(e) => setWinningNumber(e.target.value)}
                placeholder="Enter the winning number"
              />
            </div>

            <div className="field">
              <label htmlFor="numberOfWinners">
                Number of Winners 
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    How many winners to pick (additional ties will be included if tie mode is All).
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

            {/* Tie Mode: Now a dropdown */}
            <div className="field">
              <label htmlFor="tieMode">
                Tie Handling 
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    If multiple entries are equally close: choose only the first N entries or include all tied entries.
                  </span>
                </span>
              </label>
              <select
                id="tieMode"
                value={tieMode}
                onChange={(e) => setTieMode(e.target.value)}
              >
                <option value="first">First N Only</option>
                <option value="all">Include All Ties</option>
              </select>
            </div>

            {/* Duplicate Handling: Now a dropdown */}
            <div className="field">
              <label htmlFor="duplicateMode">
                Duplicate Handling 
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    If the same name appears multiple times: keep only the first occurrence or the last occurrence.
                  </span>
                </span>
              </label>
              <select
                id="duplicateMode"
                value={duplicateMode}
                onChange={(e) => setDuplicateMode(e.target.value)}
              >
                <option value="first">Keep First</option>
                <option value="last">Keep Last</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="whitelist">
                Whitelist Names 
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    Comma-separated names that should not be filtered as duplicates. All entries for these names will be counted.
                  </span>
                </span>
              </label>
              <input
                id="whitelist"
                type="text"
                value={whitelist}
                onChange={(e) => setWhitelist(e.target.value)}
                placeholder="e.g., John, Jane (names to always include all entries)"
              />
            </div>

            {/* Action Buttons */}
            <button type="submit" className="primary-btn">Pick Winners</button>
            <button type="button" className="secondary-btn" onClick={handleReset}>Reset</button>
          </form>
        </div>

        {/* Output Panel (right side) */}
        <div className="right panel">
          <h1>Results</h1>
          <div className="results">
            {timestamp ? (
              <p><strong>Timestamp:</strong> {timestamp}</p>
            ) : (
              <p className="no-winners">No winners picked yet.</p>
            )}

            <div className="field">
              <label htmlFor="winnersOutput">
                Winners Output 
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    The list of winners in the format ":W: Name - number :W:".
                  </span>
                </span>
              </label>
              <textarea
                id="winnersOutput"
                rows="5"
                readOnly
                value={winnersText}
                placeholder="No winners to display yet..."
              />
            </div>

            <div className="field">
              <label htmlFor="originalOutput">
                Original Data for Winners 
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    The original lines of data corresponding to each winner.
                  </span>
                </span>
              </label>
              <textarea
                id="originalOutput"
                rows="5"
                readOnly
                value={originalDataText}
                placeholder="Original entries of winners will appear here..."
              />
            </div>

            {/* New output showing each winner's name & difference to target */}
            <div className="field">
              <label htmlFor="differencesOutput">
                Name &amp; Difference from Winning Number
              </label>
              <textarea
                id="differencesOutput"
                rows="5"
                readOnly
                value={differencesText}
                placeholder="No differences to display yet..."
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;