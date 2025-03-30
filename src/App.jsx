import React, { useState } from "react";
import "./App.css";

function App() {
  const [rawData, setRawData] = useState("");
  const [winningNumber, setWinningNumber] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState("");

  // Tie handling defaults to "all"
  const [tieMode, setTieMode] = useState("all"); // "all" or "first"
  const [duplicateMode, setDuplicateMode] = useState("first"); // "first" or "last"
  const [whitelist, setWhitelist] = useState("");
  const [winners, setWinners] = useState([]);
  const [timestamp, setTimestamp] = useState("");

  // EXACT MATCH toggle – if true, # of winners and tie mode appear fully disabled (including label).
  const [exactMatch, setExactMatch] = useState(false);

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

  // Submit form => pick winners
  const handleSubmit = (e) => {
    e.preventDefault();
    const entries = parseRawData(rawData);
    const target = parseFloat(winningNumber);
    const winnersCount = parseInt(numberOfWinners, 10);

    // If exactMatch is false, we do want to validate # of winners. If exactMatch is true, # of winners can be ignored
    if (isNaN(target) || (isNaN(winnersCount) && !exactMatch) || ((winnersCount < 1) && !exactMatch)) {
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

    // If EXACT MATCH, only pick those who exactly matched winningNumber, ignoring tie/winners count
    if (exactMatch) {
      selectedWinners = sortedEntries.filter(e => e.number === target);
    } else {
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
    }

    setWinners(selectedWinners);
    setTimestamp(new Date().toLocaleString());
  };

  // Reset all form fields
  const handleResetAll = () => {
    setRawData("");
    setWinningNumber("");
    setNumberOfWinners("");
    setTieMode("all");
    setDuplicateMode("first");
    setWhitelist("");
    setWinners([]);
    setTimestamp("");
    setExactMatch(false);
  };

  // Clears only the Raw Data field
  const handleResetRawData = () => {
    setRawData("");
  };

  // A sample preset: "Best of 3" => # winners=2, tie=all, duplicate=first, turn off exactMatch
  const setBestOf3 = () => {
    setNumberOfWinners("2");
    setTieMode("all");
    setDuplicateMode("first");
    setExactMatch(false);
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

  // The winners box glows only if winners > 0
  const winnersBoxClass = `field winners-later ${winners.length > 0 ? 'winners-field' : ''}`;

  // If exactMatch is true => add .disabled-field to the container of # of winners & tie mode
  const numberOfWinnersFieldClass = `field ${exactMatch ? 'disabled-field' : ''}`;
  const tieModeFieldClass          = `field ${exactMatch ? 'disabled-field' : ''}`;

  return (
    <div className="app">
      {/* Header with heading and trophy icon */}
      <header className="header">
        <div className="header-left">
          who won?
          <span className="material-icons trophy-icon">emoji_events</span>
        </div>
        <div className="header-right">
          {/* Potential nav links or info */}
        </div>
      </header>

      {/* Main content area */}
      <main className="content">
        {/* Input Panel */}
        <div className="left panel">
          <h1>Inputs</h1>

          {/* Smaller preset buttons */}
          <div className="presets-container">
            <button type="button" className="preset-btn" onClick={setBestOf3}>
              Best of 3
            </button>
            {/* Additional presets if needed */}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>

            {/* EXACT MATCH iOS-Style Toggle */}
            <div className="field" style={{ flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }}>
              {/* Label text on the left, then the toggle on the right */}
              <span style={{ marginRight: "0.8rem" }}>Exact Match?</span>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={exactMatch}
                  onChange={(e) => setExactMatch(e.target.checked)}
                />
                <span className="slider"></span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="rawData">
                <span>Raw Data</span>
                <span className="tooltip" style={{ marginLeft: "0.3rem" }}>
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    Enter one entry per line: each line should contain a name and a number.
                  </span>
                </span>
                {/* Small reset button for the Raw Data field only */}
                <div className="tooltip">
                  <button
                    type="button"
                    className="field-reset-btn"
                    onClick={handleResetRawData}
                  >
                    Reset
                  </button>
                  <span className="tooltiptext">
                    Clears only the Raw Data box below.
                  </span>
                </div>
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

            {/* The "Number of Winners" field goes dark if exactMatch is on */}
            <div className={numberOfWinnersFieldClass}>
              <label htmlFor="numberOfWinners">
                Number of Winners
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    How many winners to pick (extra ties included if tie mode is Include Ties).
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
                disabled={exactMatch} /* If exact match is on, disable */
              />
            </div>

            {/* Tie mode field also grayed out if exactMatch is on */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <div className={tieModeFieldClass} style={{ flex: 1 }}>
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
                  disabled={exactMatch} /* disable when exact match is on */
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

            {/* Main action buttons: "Reset" (left), "Pick Winners" (right) */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={handleResetAll}
              >
                Reset
              </button>
              <button type="submit" className="primary-btn">
                Pick Winners
              </button>
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

            {/* Original data and differences fields first (desktop) */}
            <div className="field original-later deprioritized">
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

            <div className="field differences-later deprioritized">
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

            {/* The Winners field is physically last, but reorders on mobile if needed.
                It glows only if winners.length > 0. */}
            <div className={winnersBoxClass}>
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
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;