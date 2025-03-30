import React, { useState } from "react";
import "./App.css";

/** 
 * Helper to transform names if filter is on
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
  const [rawData, setRawData] = useState("");
  const [winningNumber, setWinningNumber] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState("");
  const [tieMode, setTieMode] = useState("all");
  // Duplicate is always enabled, even if exactMatch is on
  const [duplicateMode, setDuplicateMode] = useState("first");
  const [exactMatch, setExactMatch] = useState(false);
  const [whitelist, setWhitelist] = useState("");
  const [filterNames, setFilterNames] = useState(true);

  // autoReset toggle
  const [autoReset, setAutoReset] = useState(true);

  // Results & errors
  const [winners, setWinners] = useState([]);
  const [timestamp, setTimestamp] = useState("");
  const [rawDataError, setRawDataError] = useState("");
  const [winningNumberError, setWinningNumberError] = useState("");
  const [numberOfWinnersError, setNumberOfWinnersError] = useState("");

  function clearErrors() {
    setRawDataError("");
    setWinningNumberError("");
    setNumberOfWinnersError("");
  }

  // If autoReset is on, modifying any input clears results
  function maybeResetResults() {
    if (autoReset) {
      setWinners([]);
      setTimestamp("");
    }
  }

  // OnChange handlers
  const handleRawDataChange = (e) => {
    setRawData(e.target.value);
    maybeResetResults();
  };
  const handleWinningNumberChange = (e) => {
    setWinningNumber(e.target.value);
    maybeResetResults();
  };
  const handleNumberOfWinnersChange = (e) => {
    setNumberOfWinners(e.target.value);
    maybeResetResults();
  };
  const handleTieModeChange = (e) => {
    setTieMode(e.target.value);
    maybeResetResults();
  };
  const handleDuplicateModeChange = (e) => {
    setDuplicateMode(e.target.value);
    maybeResetResults();
  };
  const handleWhitelistChange = (e) => {
    setWhitelist(e.target.value);
    maybeResetResults();
  };

  // Toggle exact match. If turning on, clear numberOfWinners
  const handleExactMatchToggle = () => {
    const newVal = !exactMatch;
    setExactMatch(newVal);
    if (!exactMatch) {
      setNumberOfWinners("");
    }
    maybeResetResults();
  };

  // Toggling auto-reset
  const handleAutoResetToggle = () => {
    setAutoReset(!autoReset);
  };

  // Parse raw data
  function parseRawData(data) {
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
  }

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
      selectedWinners = filteredEntries.filter(e => e.number === parseFloat(winningNumber));
    } else {
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

  const handleReset = () => {
    // Clears all fields and errors
    setRawData("");
    setWinningNumber("");
    setNumberOfWinners("");
    setTieMode("all");
    setDuplicateMode("first");
    setWhitelist("");
    setExactMatch(false);
    setFilterNames(true);
    setWinners([]);
    setTimestamp("");
    clearErrors();
  };

  // The small button to reset only the Raw Data field
  const handleResetRawData = () => {
    setRawData("");
    maybeResetResults();
  };

  const handlePromoPreset = () => {
    setNumberOfWinners("2");
    setDuplicateMode("first");
    setTieMode("first");
    setExactMatch(false);
    maybeResetResults();
  };
  const handleClassicPreset = () => {
    setNumberOfWinners("1");
    setDuplicateMode("last");
    setTieMode("all");
    setExactMatch(false);
    maybeResetResults();
  };

  /** 
   * Best of 3: # winners = 2, tie=all, dup=first, exactMatch off 
   */
  const handleBestOf3Preset = () => {
    setNumberOfWinners("2");
    setTieMode("all");
    setDuplicateMode("first");
    setExactMatch(false);
    maybeResetResults();
  };

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

  // The winners field glows if we have winners
  const winnersBoxClass = `field ${winners.length > 0 ? "winners-field" : ""}`;

  // If exactMatch => gray out numberOfWinners & tieMode fields (including labels).
  const disableSectionClass = exactMatch ? "disabled-section" : "";

  return (
    <div className="app-outer">
      <div className="app">
        {/* 
          Header with a winner icon from google fonts 
          (emoji_events) at the left side, in green 
        */}
        <header className="header">
          <div className="header-left">
            <span className="material-icons winner-icon">emoji_events</span>
            who won?
          </div>
          <div className="header-right">
            {/* auto-reset toggle */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <div className="tooltip label-with-icon" style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                <span style={{ fontSize: "0.9em" }}>Auto-Reset Results</span>
                <span className="material-icons" style={{ fontSize: "18px", color: "#888" }}>info</span>
                <span className="tooltiptext">
                  When enabled, modifying any input fields automatically clears the results section.
                </span>
              </div>
              <div className="ios-toggle-container">
                <div
                  className={`ios-toggle ${autoReset ? "checked" : ""}`}
                  onClick={handleAutoResetToggle}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          <div className="left panel">
            <h2 className="section-title">
              <span className="material-icons">tune</span>
              Inputs
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div className="field">
                <label htmlFor="rawData" className="label-with-icon">
                  Raw Data
                  <span className="tooltip">
                    <span className="material-icons">info</span>
                    <span className="tooltiptext">
                      Enter one entry per line: each line should contain a name and a number.
                    </span>
                  </span>

                  {/* Small Reset (only for Raw Data) */}
                  <span className="tooltip">
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
                  </span>
                </label>
                <textarea
                  id="rawData"
                  rows="8"
                  value={rawData}
                  onChange={handleRawDataChange}
                  placeholder="Paste your raw data here (one name and number per line)..."
                />
                {rawDataError && <div className="field-error">{rawDataError}</div>}
              </div>

              <div className="field">
                <label htmlFor="winningNumber" className="label-with-icon">
                  Winning Number
                  <span className="tooltip">
                    <span className="material-icons">info</span>
                    <span className="tooltiptext">The target number to compare or match exactly.</span>
                  </span>
                </label>
                <input
                  id="winningNumber"
                  type="text"
                  value={winningNumber}
                  onChange={handleWinningNumberChange}
                  placeholder="Enter the winning number"
                />
                {winningNumberError && <div className="field-error">{winningNumberError}</div>}
              </div>

              {/* # of Winners & Exact Match side by side */}
              <div className="field" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ flex: 1 }} className={disableSectionClass}>
                  <label htmlFor="numberOfWinners" style={{ justifyContent: "flex-start" }}>
                    <div className="label-with-icon">
                      Number of Winners
                      <span className="tooltip">
                        <span className="material-icons">info</span>
                        <span className="tooltiptext">How many winners to pick (unless Exact Match is on).</span>
                      </span>
                    </div>
                  </label>
                  <input
                    id="numberOfWinners"
                    type="number"
                    value={numberOfWinners}
                    onChange={handleNumberOfWinnersChange}
                    placeholder="Enter number of winners"
                    min="1"
                    disabled={exactMatch}
                  />
                  {numberOfWinnersError && <div className="field-error">{numberOfWinnersError}</div>}
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ marginBottom: "0.3em" }}>Exact Match</label>
                  <div className="ios-toggle-container">
                    <div
                      className={`ios-toggle ${exactMatch ? "checked" : ""}`}
                      onClick={handleExactMatchToggle}
                    />
                    <span className="tooltip">
                      <span className="material-icons" style={{ fontSize: "18px", color: "#888" }}>info</span>
                      <span className="tooltiptext">
                        Only pick entries whose number matches exactly. 
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Tie & Duplicate side by side. Tie is grayed out if exactMatch */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <div className={`field ${disableSectionClass}`} style={{ flex: 1 }}>
                  <label htmlFor="tieMode" className="label-with-icon">
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
                    onChange={handleTieModeChange}
                    disabled={exactMatch}
                  >
                    <option value="all">Include Ties</option>
                    <option value="first">First Answer</option>
                  </select>
                </div>

                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="duplicateMode" className="label-with-icon">
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
                    onChange={handleDuplicateModeChange}
                  >
                    <option value="first">Keep First</option>
                    <option value="last">Keep Last</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="whitelist" className="label-with-icon">
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
                  onChange={handleWhitelistChange}
                  placeholder="e.g. Marko K, Ville W"
                />
              </div>

              <button type="submit" className="primary-btn pick-winners-wide">
                <span className="material-icons" style={{ fontSize: "1.2rem" }}>done_all</span>
                Pick Winners
              </button>
            </form>
          </div>

          <div className="right" style={{ flexDirection: "column" }}>
            <div className="panel presets-block">
              <h2 className="section-title">
                <span className="material-icons">widgets</span>
                Presets
              </h2>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "0.3rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="secondary-btn tooltip" onClick={handlePromoPreset}>
                    <span className="material-icons">local_offer</span>
                    Promo
                    <span className="tooltiptext">
                      Sets Number of Winners=2, Duplicate=Keep First, Tie=First Answer,
                      disables Exact Match, and auto-resets results if that toggle is on.
                    </span>
                  </button>

                  <button className="secondary-btn tooltip" onClick={handleClassicPreset}>
                    <span className="material-icons">history</span>
                    Classic
                    <span className="tooltiptext">
                      Sets Number of Winners=1, Duplicate=Keep Last, Tie=Include Ties,
                      disables Exact Match, and auto-resets results if that toggle is on.
                    </span>
                  </button>

                  {/* New Best of 3 preset, same style/size as the others */}
                  <button className="secondary-btn tooltip" onClick={handleBestOf3Preset}>
                    <span className="material-icons">sports_score</span>
                    Best of 3
                    <span className="tooltiptext">
                      Sets Number of Winners=2, Tie=Include Ties, Duplicate=Keep First,
                      disables Exact Match, and auto-resets if toggled on.
                    </span>
                  </button>
                </div>

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

            <div className="panel results-block">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>
                  <span className="material-icons">list_alt</span>
                  Results
                </h2>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <div className="tooltip label-with-icon" style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    <span style={{ fontSize: "0.9em" }}>Message Filter</span>
                    <span className="material-icons" style={{ fontSize: "18px", color: "#888" }}>info</span>
                    <span className="tooltiptext">
                      When enabled, second word in each winner’s name is shortened
                      by removing digits/currency, e.g. "Ben Bcool98" -&gt; "Ben B - 98".
                      Original messages remain unchanged.
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
                  <label htmlFor="originalOutput" className="label-with-icon">
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
                  <label htmlFor="differencesOutput" className="label-with-icon">
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
                  <label htmlFor="winnersOutput" className="label-with-icon">
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