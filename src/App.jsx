import React, { useState } from "react";
import "./App.css";

/**
 * Transform the name if the 'Message Filter' is on.
 */
function transformName(originalName) {
  const words = originalName.trim().split(/\s+/);
  if (!words.length) return originalName;
  const firstWord = words[0];
  const secondWord = words[1] || "";

  const alphaOnly = secondWord.replace(/[^a-zA-Z]/g, "");
  const secondLetter = alphaOnly.length > 0 ? alphaOnly[0] : "";

  return secondLetter ? `${firstWord} ${secondLetter}` : firstWord;
}

function App() {
  // Fields
  const [rawData, setRawData] = useState("");
  const [winningNumber, setWinningNumber] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState("");
  const [tieMode, setTieMode] = useState("all");
  const [duplicateMode, setDuplicateMode] = useState("first");
  const [exactMatch, setExactMatch] = useState(false);
  const [whitelist, setWhitelist] = useState("");

  // Toggle for "Message Filter"
  const [filterNames, setFilterNames] = useState(true); // default on

  // Winners & metadata
  const [winners, setWinners] = useState([]);
  const [timestamp, setTimestamp] = useState("");

  // Inline errors
  const [rawDataError, setRawDataError] = useState("");
  const [winningNumberError, setWinningNumberError] = useState("");
  const [numberOfWinnersError, setNumberOfWinnersError] = useState("");

  // Clear error messages
  const clearErrors = () => {
    setRawDataError("");
    setWinningNumberError("");
    setNumberOfWinnersError("");
  };

  // Parse the raw data
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

  // "Pick Winners"
  const handleSubmit = (e) => {
    e.preventDefault();
    clearErrors();

    let hasError = false;
    if (!rawData.trim()) {
      setRawDataError("No data provided. Please enter at least one name/number pair.");
      hasError = true;
    }
    const target = parseFloat(winningNumber);
    if (isNaN(target)) {
      setWinningNumberError("Please provide a valid numeric Winning Number.");
      hasError = true;
    }
    if (!exactMatch) {
      const wCount = parseInt(numberOfWinners, 10);
      if (isNaN(wCount) || wCount < 1) {
        setNumberOfWinnersError("Please provide a valid Number of Winners (>=1).");
        hasError = true;
      }
    }
    if (hasError) return;

    const entries = parseRawData(rawData);

    // Whitelist
    const whitelistArray = whitelist
      .split(",")
      .map(name => name.trim())
      .filter(name => name !== "");

    // Filter duplicates 
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
            seen[entry.name] = entry;
          }
        }
      }
    }
    for (const name in seen) {
      filteredEntries.push(seen[name]);
    }

    let selectedWinners = [];
    if (exactMatch) {
      // only those that exactly match the number
      const t = parseFloat(winningNumber);
      selectedWinners = filteredEntries.filter(e => e.number === t);
    } else {
      // sort by closeness
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

  // Presets
  const handlePromoPreset = () => {
    setNumberOfWinners("2");
    setDuplicateMode("first");
    setTieMode("first");
    setExactMatch(false);
  };
  const handleClassicPreset = () => {
    setNumberOfWinners("1");
    setDuplicateMode("last");
    setTieMode("all");
    setExactMatch(false);
  };

  // Toggle for "Message Filter"
  const toggleFilterNames = () => {
    setFilterNames(!filterNames);
  };

  // Build final outputs
  const winnersText = winners
    .map(w => {
      const dispName = filterNames ? transformName(w.name) : (w.name || "No Name");
      return `:W: ${dispName} - ${w.number} :W:`;
    })
    .join("\n");

  const originalDataText = winners.map(w => w.original).join("\n");

  const differencesText = winners
    .map(w => {
      const diff = Math.abs(w.number - parseFloat(winningNumber)).toFixed(2);
      const dispName = filterNames ? transformName(w.name) : (w.name || "No Name");
      return `Name: ${dispName}, Difference: ${diff}`;
    })
    .join("\n");

  // Winners field glows if we have winners
  const winnersBoxClass = `field ${winners.length > 0 ? "winners-field" : ""}`;
  // tie/duplicate fields disabled if exactMatch is on
  const tieDuplicateClasses = exactMatch ? "disabled-section" : "";

  return (
    <div className="app-outer">
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-left">who won?</div>
          <div className="header-right"></div>
        </header>

        <main className="content">
          {/* Left Panel */}
          <div className="left panel">
            <h2 className="section-title">
              <span className="material-icons">tune</span>
              Inputs
            </h2>

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

              {/* Number of Winners & Exact Match Toggle side by side */}
              <div className="field" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                {/* Number of Winners block (possibly grayed if exactMatch) */}
                <div style={{ flex: 1 }} className={exactMatch ? "disabled-section" : ""}>
                  <label htmlFor="numberOfWinners" style={{ justifyContent: "flex-start" }}>
                    <div className="num-winners-label">
                      Number of Winners
                      <span className="tooltip">
                        <span className="material-icons">info</span>
                        <span className="tooltiptext">
                          How many winners to pick (unless Exact Match is on).
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

                {/* Exact Match toggle remains active even if exactMatch is on */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ marginBottom: "0.3em" }}>
                    Exact Match
                  </label>
                  <div className="ios-toggle-container">
                    <div
                      className={`ios-toggle ${exactMatch ? "checked" : ""}`}
                      onClick={() => setExactMatch(!exactMatch)}
                    />
                    <span className="tooltip">
                      <span className="material-icons">info</span>
                      <span className="tooltiptext">
                        Only pick entries whose number matches exactly; tie &amp; duplicate settings won't apply.
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Tie & duplicate fields side by side */}
              <div className={tieDuplicateClasses} style={{ display: "flex", gap: "1rem" }}>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="tieMode">
                    Tie Handling
                    <span className="tooltip">
                      <span className="material-icons">info</span>
                      <span className="tooltiptext">
                        If multiple entries are equally close, pick only the first or include all ties.
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

              {/* "Pick Winners" button with animated gradient */}
              <button
                type="submit"
                className="primary-btn pick-winners-wide"
              >
                <span className="material-icons" style={{ fontSize: "1.2rem" }}>done_all</span>
                Pick Winners
              </button>
            </form>
          </div>

          {/* Right Column: Two stacked panels with .presets-block and .results-block
              We'll reorder them on mobile so .results-block is first. */}
          <div className="right" style={{ flexDirection: "column" }}>
            {/* Presets Panel */}
            <div className="panel presets-block">
              <h2 className="section-title">
                <span className="material-icons">widgets</span>
                Presets
              </h2>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "0.3rem" }}>
                {/* "Promo" & "Classic" on the left, with tooltips */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="secondary-btn tooltip" onClick={handlePromoPreset}>
                    <span className="material-icons">local_offer</span>
                    Promo
                    <span className="tooltiptext">
                      Sets Number of Winners=2, Duplicate=Keep First, Tie=First Answer, disables Exact Match.
                    </span>
                  </button>

                  <button className="secondary-btn tooltip" onClick={handleClassicPreset}>
                    <span className="material-icons">history</span>
                    Classic
                    <span className="tooltiptext">
                      Sets Number of Winners=1, Duplicate=Keep Last, Tie=Include Ties, disables Exact Match.
                    </span>
                  </button>
                </div>

                {/* Reset icon on the right (muted red) */}
                <div style={{ marginLeft: "auto" }}>
                  <button className="reset-button tooltip" onClick={handleReset}>
                    <span className="material-icons">refresh</span>
                    <span className="tooltiptext">
                      Clears all fields and errors, returning to defaults.
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="panel results-block">
              {/* Results heading + Message Filter toggle in same line */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                {/* Left side: heading with icon */}
                <h2 className="section-title" style={{ marginBottom: 0 }}>
                  <span className="material-icons">list_alt</span>
                  Results
                </h2>
                {/* Right side: label & info icon to left of toggle */}
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <div className="tooltip" style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    <span style={{ fontSize: "0.9em" }}>Message Filter</span>
                    <span className="material-icons">info</span>
                    <span className="tooltiptext">
                      When enabled, the second word in each winner’s name is shortened 
                      by removing digits/currency, e.g. "Ben Bcool98" -&gt; "Ben B - 98". 
                      Original messages are always unchanged.
                    </span>
                  </div>

                  <div className="ios-toggle-container">
                    <div
                      className={`ios-toggle ${filterNames ? "checked" : ""}`}
                      onClick={toggleFilterNames}
                    />
                  </div>
                </div>
              </div>

              <div className="results">
                {timestamp ? (
                  <p className="timestamp">
                    <strong>Timestamp:</strong> {timestamp}
                  </p>
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
                        Always includes entire message, ignoring filters.
                      </span>
                    </span>
                  </label>
                  <textarea
                    id="originalOutput"
                    rows="4"
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
                        Winner’s name (possibly filtered) plus difference to the winning number, to 2 decimals.
                      </span>
                    </span>
                  </label>
                  <textarea
                    id="differencesOutput"
                    rows="4"
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
                        Name is shortened if "Message Filter" is on.
                      </span>
                    </span>
                  </label>
                  <textarea
                    id="winnersOutput"
                    rows="4"
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
    </div>
  );
}

export default App;