import React, { useState } from "react";
import "./App.css";

function App() {
  // Fields
  const [rawData, setRawData] = useState("");
  const [winningNumber, setWinningNumber] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState("");
  const [tieMode, setTieMode] = useState("all");       // "all" or "first"
  const [duplicateMode, setDuplicateMode] = useState("first"); // "first" or "last"
  const [exactMatch, setExactMatch] = useState(false);
  const [whitelist, setWhitelist] = useState("");

  // Winners
  const [winners, setWinners] = useState([]);
  const [timestamp, setTimestamp] = useState("");

  // Inline error states
  const [rawDataError, setRawDataError] = useState("");
  const [winningNumberError, setWinningNumberError] = useState("");
  const [numberOfWinnersError, setNumberOfWinnersError] = useState("");

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

  // Clear all error messages
  const clearErrors = () => {
    setRawDataError("");
    setWinningNumberError("");
    setNumberOfWinnersError("");
  };

  // "Pick Winners"
  const handleSubmit = (e) => {
    e.preventDefault();
    clearErrors();

    let hasError = false;

    // Validate rawData if desired
    if (!rawData.trim()) {
      // Not strictly required to have raw data if user wants an empty set, but let's warn them
      setRawDataError("No data provided. Make sure you have at least one name/number entry!");
      hasError = true;
    }

    // Validate winning number
    const target = parseFloat(winningNumber);
    if (isNaN(target)) {
      setWinningNumberError("Please provide a valid numeric Winning Number.");
      hasError = true;
    }

    // If exactMatch is off, we need a valid numberOfWinners
    if (!exactMatch) {
      const wCount = parseInt(numberOfWinners, 10);
      if (isNaN(wCount) || wCount < 1) {
        setNumberOfWinnersError("Please provide a valid Number of Winners (>=1).");
        hasError = true;
      }
    }

    if (hasError) {
      // If any field is invalid, don't proceed
      return;
    }

    // Parse data
    const entries = parseRawData(rawData);

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
            seen[entry.name] = entry; // keep later entry
          }
        }
      }
    }
    for (const name in seen) {
      filteredEntries.push(seen[name]);
    }

    let selectedWinners = [];

    if (exactMatch) {
      // Pick only entries whose number == target
      selectedWinners = filteredEntries.filter(e => e.number === target);
    } else {
      // Sort by closeness
      const sortedEntries = filteredEntries.sort((a, b) => {
        const diffA = Math.abs(a.number - target);
        const diffB = Math.abs(b.number - target);
        if (diffA === diffB) {
          return a.index - b.index;
        }
        return diffA - diffB;
      });

      const wCount = parseInt(numberOfWinners, 10);
      if (tieMode === "first") {
        selectedWinners = sortedEntries.slice(0, wCount);
      } else {
        // "all" -> include ties after top N
        selectedWinners = sortedEntries.slice(0, wCount);
        if (selectedWinners.length > 0) {
          const thresholdDiff = Math.abs(selectedWinners[selectedWinners.length - 1].number - target);
          for (let i = wCount; i < sortedEntries.length; i++) {
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

  // "Reset"
  const handleReset = () => {
    setRawData("");
    setWinningNumber("");
    setNumberOfWinners("");
    setTieMode("all");
    setDuplicateMode("first");
    setWhitelist("");
    setExactMatch(false);
    setWinners([]);
    setTimestamp("");
    clearErrors();
  };

  // Preset "Promo"
  const handlePromoPreset = () => {
    // Does not reset rawData
    setNumberOfWinners("2");
    setDuplicateMode("first");
    setTieMode("first");
    setExactMatch(false);
  };

  // Preset "Classic"
  const handleClassicPreset = () => {
    setNumberOfWinners("1");
    setDuplicateMode("last");
    setTieMode("all");
    setExactMatch(false);
  };

  // Build output strings
  const winnersText = winners
    .map(w => `:W: ${w.name || "No Name"} - ${w.number} :W:`)
    .join("\n");
  const originalDataText = winners.map(w => w.original).join("\n");
  // Round difference to 2 decimals
  const differencesText = winners
    .map(w => {
      const diff = Math.abs(w.number - parseFloat(winningNumber)).toFixed(2);
      return `Name: ${w.name || "No Name"}, Difference: ${diff}`;
    })
    .join("\n");

  // The winners box only glows if we have at least one winner
  const winnersBoxClass = `field ${winners.length > 0 ? 'winners-field' : ''}`;

  // iOS style toggle
  const toggleExactMatch = () => {
    setExactMatch(!exactMatch);
  };

  // If exactMatch is on, tie & duplicate settings are disabled & visually grayed out
  const tieDuplicateClasses = exactMatch ? "disabled-section" : "";
  // Similarly, if exactMatch is on, numberOfWinners is disabled but let's also style it with .disabled-section
  const numberOfWinnersClasses = exactMatch ? "disabled-section" : "";

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">who won?</div>
        <div className="header-right"></div>
      </header>

      <main className="content">
        {/* Left Panel */}
        <div className="left panel">
          <h1>
            <span className="material-icons" style={{ verticalAlign: "middle", marginRight: "0.3em" }}>
              tune
            </span>
            Inputs
          </h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {/* Raw Data */}
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
              {rawDataError && <div className="field-error">{rawDataError}</div>}
            </div>

            {/* Winning Number */}
            <div className="field">
              <label htmlFor="winningNumber">
                Winning Number
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    The target number to compare or match exactly.
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
              {winningNumberError && <div className="field-error">{winningNumberError}</div>}
            </div>

            {/* Number of Winners + iOS toggle */}
            <div className={`field ${numberOfWinnersClasses}`}>
              <label htmlFor="numberOfWinners" style={{ justifyContent: "flex-start" }}>
                <div>
                  Number of Winners
                  <span className="tooltip">
                    <span className="material-icons">info</span>
                    <span className="tooltiptext">
                      How many winners to pick (unless Exact Match is on).
                    </span>
                  </span>
                </div>
                {/* iOS-like toggle for Exact Match, with label text on left and info icon on right */}
                <div className="ios-toggle-container" style={{ marginLeft: "auto" }}>
                  <span>Exact Match</span>
                  <div
                    className={`ios-toggle ${exactMatch ? "checked" : ""}`}
                    onClick={toggleExactMatch}
                  />
                  <span className="tooltip">
                    <span className="material-icons">info</span>
                    <span className="tooltiptext">
                      Only pick entries whose number matches exactly; tie &amp; duplicate settings won't apply.
                    </span>
                  </span>
                </div>
              </label>
              <input
                id="numberOfWinners"
                type="number"
                value={numberOfWinners}
                onChange={(e) => setNumberOfWinners(e.target.value)}
                placeholder="Enter number of winners"
                min="1"
                disabled={exactMatch}
              />
              {numberOfWinnersError && <div className="field-error">{numberOfWinnersError}</div>}
            </div>

            {/* Tie mode & duplicate mode side by side */}
            <div className={tieDuplicateClasses} style={{ display: "flex", gap: "1rem" }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="tieMode">
                  Tie Handling
                  <span className="tooltip">
                    <span className="material-icons">info</span>
                    <span className="tooltiptext">
                      If multiple entries are equally close, pick only the first N or include all ties.
                    </span>
                  </span>
                </label>
                <select
                  id="tieMode"
                  value={tieMode}
                  onChange={(e) => setTieMode(e.target.value)}
                  disabled={exactMatch}
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
                      If the same name appears multiple times, keep only the first or last occurrence.
                    </span>
                  </span>
                </label>
                <select
                  id="duplicateMode"
                  value={duplicateMode}
                  onChange={(e) => setDuplicateMode(e.target.value)}
                  disabled={exactMatch}
                >
                  <option value="first">Keep First</option>
                  <option value="last">Keep Last</option>
                </select>
              </div>
            </div>

            {/* Whitelist */}
            <div className="field">
              <label htmlFor="whitelist">
                Whitelist Names
                <span className="tooltip">
                  <span className="material-icons">info</span>
                  <span className="tooltiptext">
                    Comma-separated names that should not be filtered out as duplicates.
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

            {/* "Pick Winners" spans entire column */}
            <button
              type="submit"
              className="primary-btn pick-winners-wide"
              style={{ marginTop: "auto" }}
            >
              <span className="material-icons">done_all</span>
              Pick Winners
            </button>
          </form>
        </div>

        {/* Right Column: Two stacked panels: Presets & Results */}
        <div className="right" style={{ flexDirection: "column" }}>
          {/* Presets Panel */}
          <div className="panel">
            <h2 style={{ marginTop: 0, marginBottom: "1rem" }}>
              <span className="material-icons" style={{ verticalAlign: "middle", marginRight: "0.3em" }}>
                widgets
              </span>
              Presets
            </h2>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
              {/* "Promo" & "Classic" on the left */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="secondary-btn" onClick={handlePromoPreset}>
                  <span className="material-icons">local_offer</span>
                  Promo
                </button>
                <button className="secondary-btn" onClick={handleClassicPreset}>
                  <span className="material-icons">history</span>
                  Classic
                </button>
              </div>

              {/* Reset icon on the right */}
              <div style={{ marginLeft: "auto" }}>
                <button className="reset-button" onClick={handleReset}>
                  <span className="material-icons">refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="panel">
            <h1 style={{ marginTop: 0 }}>
              <span className="material-icons" style={{ verticalAlign: "middle", marginRight: "0.3em" }}>
                list_alt
              </span>
              Results
            </h1>

            <div className="results">
              {timestamp ? (
                <p><strong>Timestamp:</strong> {timestamp}</p>
              ) : (
                <p className="no-winners">No winners picked yet.</p>
              )}

              <div className="field deprioritized">
                <label htmlFor="originalOutput">
                  Original Messages
                  <span className="tooltip">
                    <span className="material-icons">info</span>
                    <span className="tooltiptext">
                      The original lines from the raw data that correspond to each winner.
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
                  <span className="tooltip">
                    <span className="material-icons">info</span>
                    <span className="tooltiptext">
                      The difference between each winner’s guess and the winning number, rounded to 2 decimals.
                    </span>
                  </span>
                </label>
                <textarea
                  id="differencesOutput"
                  rows="5"
                  readOnly
                  value={differencesText}
                  placeholder="No differences to display yet..."
                />
              </div>

              <div className={winnersBoxClass}>
                <label htmlFor="winnersOutput">
                  Winners
                  <span className="tooltip">
                    <span className="material-icons">info</span>
                    <span className="tooltiptext">
                      List of winners in the format ":W: Name - number :W:".
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
        </div>
      </main>
    </div>
  );
}

export default App;