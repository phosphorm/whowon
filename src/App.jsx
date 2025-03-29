import React, { useState } from "react";
import "./App.css";

function App() {
  const [rawData, setRawData] = useState("");
  const [winningNumber, setWinningNumber] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState("");

  // Tie handling defaults to "all"
  const [tieMode, setTieMode] = useState("all");       // "all" or "first"
  const [duplicateMode, setDuplicateMode] = useState("first"); // "first" or "last"
  const [whitelist, setWhitelist] = useState("");
  const [winners, setWinners] = useState([]);
  const [timestamp, setTimestamp] = useState("");

  // Parse raw data lines
  const parseRawData = (data) => {
    return data
      .split("\n")
      .map((line, index) => ({ line: line.trim(), index }))
      .filter(item => item.line.length > 0)
      .map(({ line, index }) => {
        const match = line.match(/([-+]?[0-9]*[.,]?[0-9]+)/);
        if (match) {
          const numberValue = parseFloat(match[0].replace(",", "."));
          const name = line.replace(match[0], "").trim();
          return { name, number: numberValue, original: line, index };
        }
        return null;
      })
      .filter(item => item !== null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const entries = parseRawData(rawData);
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
        filteredEntries.push(entry);
      } else {
        if (!(entry.name in seen)) {
          seen[entry.name] = entry;
        } else {
          if (duplicateMode === "last") {
            seen[entry.name] = entry; // keep the later entry
          }
          // if mode is "first", do nothing
        }
      }
    }
    // Add back unique non-whitelisted
    for (const name in seen) {
      filteredEntries.push(seen[name]);
    }

    // Sort by closeness
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
      selectedWinners = sortedEntries.slice(0, winnersCount);
    } else {
      // "all" -> include ties after top N
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
    setTieMode("all");
    setDuplicateMode("first");
    setWhitelist("");
    setWinners([]);
    setTimestamp("");
  };

  // Output strings
  const winnersText = winners
    .map(w => `:W: ${w.name || "No Name"} - ${w.number} :W:`)
    .join("\n");
  const originalDataText = winners.map(w => w.original).join("\n");
  const differencesText = winners
    .map(w => {
      const diff = Math.abs(w.number - parseFloat(winningNumber));
      return `Name: ${w.name || "No Name"}, Difference: ${diff}`;
    })
    .join("\n");

  return (
    <div className="app">
      {/* Header (non-sticky) */}
      <header className="header">
        {/* Changed heading to "who won?" */}
        <div className="header-left">who won?</div>
        <div className="header-right">
          {/* Could add links or other content here */}
        </div>
      </header>

      {/* Main content area */}
      <main className="content">
        {/* Input Panel */}
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
                    How many winners to pick (extra ties will be included if tie mode is Include Ties).
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

            {/* Tie mode & duplicate mode side by side */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="tieMode">
                  Tie Handling
                  <span className="tooltip">
                    <span className="material-icons">info</span>
                    <span className="tooltiptext">
                      If multiple entries are equally close: choose only the first answer or include ties.
                    </span>
                  </span>
                </label>
                <select
                  id="tieMode"
                  value={tieMode}
                  onChange={(e) => setTieMode(e.target.value)}
                >
                  <option value="all">Include Ties</option>
                  <option value="first">First Answer</option>
                </select>
              </div>

              <div className="field" style={{ flex: 1 }}>
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
                placeholder="e.g. Marko K, Ville W"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
              <button type="submit" className="primary-btn">Pick Winners</button>
              <button type="button" className="secondary-btn" onClick={handleReset}>Reset</button>
            </div>
          </form>
        </div>

        {/* Results Panel */}
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
                Winners
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

            {/* De-prioritized sections */}
            <div className="field deprioritized">
              <label htmlFor="originalOutput">
                Original Messages
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

            <div className="field deprioritized">
              <label htmlFor="differencesOutput">
                Name(s) &amp; Difference
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