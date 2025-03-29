import React, { useState } from "react";
import "./App.css";

function App() {
  const [rawData, setRawData] = useState("");
  const [winningNumber, setWinningNumber] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState("");
  const [tieMode, setTieMode] = useState("first"); // "first" or "all"
  const [duplicateMode, setDuplicateMode] = useState("first"); // "first" or "last"
  const [whitelist, setWhitelist] = useState("");
  const [winners, setWinners] = useState([]);
  const [timestamp, setTimestamp] = useState("");

  // Parse the raw data into objects with name, number, original text, and index
  const parseRawData = (data) => {
    return data
      .split("\n")
      .map((line, index) => ({ line: line.trim(), index }))
      .filter(item => item.line.length > 0)
      .map(({ line, index }) => {
        // Extract the first number-like pattern (supports comma or dot)
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

    // Process whitelist: assume comma-separated names (trimmed)
    const whitelistArray = whitelist
      .split(",")
      .map(name => name.trim())
      .filter(name => name !== "");

    // Duplicate filtering (for non-whitelisted names)
    const filteredEntries = [];
    const seen = {};

    for (const entry of entries) {
      if (whitelistArray.includes(entry.name)) {
        // Keep all entries for whitelisted names
        filteredEntries.push(entry);
      } else {
        // For non-whitelisted names, keep one entry based on duplicateMode
        if (!(entry.name in seen)) {
          seen[entry.name] = entry;
        } else {
          if (duplicateMode === "last") {
            seen[entry.name] = entry;
          }
          // In "first" mode, we keep the earlier entry.
        }
      }
    }

    // Add the filtered unique entries for non-whitelisted names
    for (const name in seen) {
      filteredEntries.push(seen[name]);
    }

    // Now sort the entries based on closeness to the winning number.
    // If two entries are equally close, the one with the lower index comes first.
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
      // Simply slice the first winnersCount entries.
      selectedWinners = sortedEntries.slice(0, winnersCount);
    } else if (tieMode === "all") {
      // Start by slicing winnersCount entries.
      selectedWinners = sortedEntries.slice(0, winnersCount);
      if (selectedWinners.length > 0) {
        const thresholdDiff = Math.abs(
          selectedWinners[selectedWinners.length - 1].number - target
        );
        // Include any further entries that tie with the last picked winner.
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

  // Format winners output as requested: ":W: Name - number :W:"
  const winnersText = winners
    .map(winner => `:W: ${winner.name || "No Name"} - ${winner.number} :W:`)
    .join("\n");

  return (
    <div className="App">
      <h1>Closest Number Picker</h1>
      <form onSubmit={handleSubmit} className="form-container">
        {/* Left Column */}
        <div className="left-column">
          <div className="form-group">
            <label htmlFor="rawData">Raw Data:</label>
            <textarea
              id="rawData"
              rows="10"
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="Paste your raw data here..."
            />
          </div>
          <div className="form-group whitelist">
            <label htmlFor="whitelist">
              Whitelist (comma-separated names - all entries for these names are counted):
            </label>
            <input
              id="whitelist"
              type="text"
              value={whitelist}
              onChange={(e) => setWhitelist(e.target.value)}
              placeholder="e.g., John, Jane, Bob"
            />
          </div>
          <div className="form-group tie-mode">
            <p><strong>Tie Handling (if entries are equally close):</strong></p>
            <label>
              <input
                type="radio"
                name="tieMode"
                value="first"
                checked={tieMode === "first"}
                onChange={(e) => setTieMode(e.target.value)}
              />
              First Instance Only
            </label>
            <br />
            <label>
              <input
                type="radio"
                name="tieMode"
                value="all"
                checked={tieMode === "all"}
                onChange={(e) => setTieMode(e.target.value)}
              />
              All Instances
            </label>
          </div>
          <div className="form-group duplicate-mode">
            <p><strong>Duplicate Handling (if same name appears multiple times):</strong></p>
            <label>
              <input
                type="radio"
                name="duplicateMode"
                value="first"
                checked={duplicateMode === "first"}
                onChange={(e) => setDuplicateMode(e.target.value)}
              />
              Keep First Answer
            </label>
            <br />
            <label>
              <input
                type="radio"
                name="duplicateMode"
                value="last"
                checked={duplicateMode === "last"}
                onChange={(e) => setDuplicateMode(e.target.value)}
              />
              Keep Last Answer
            </label>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column">
          <div className="form-group">
            <label htmlFor="winningNumber">Winning Number:</label>
            <input
              id="winningNumber"
              type="text"
              value={winningNumber}
              onChange={(e) => setWinningNumber(e.target.value)}
              placeholder="Enter winning number"
            />
          </div>
          <div className="form-group">
            <label htmlFor="numberOfWinners">Number of Winners:</label>
            <input
              id="numberOfWinners"
              type="number"
              value={numberOfWinners}
              onChange={(e) => setNumberOfWinners(e.target.value)}
              placeholder="Enter number of winners"
              min="1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="winnersOutput">Winners Output:</label>
            <textarea
              id="winnersOutput"
              readOnly
              rows="8"
              value={winnersText}
              placeholder="Winners will appear here..."
            />
          </div>
          <div className="form-group buttons">
            <button type="submit">Pick Winners</button>
            <button type="button" onClick={handleReset}>Reset</button>
          </div>
        </div>
      </form>

      {timestamp && (
        <div className="results">
          <p><strong>Timestamp:</strong> {timestamp}</p>
        </div>
      )}
    </div>
  );
}

export default App;