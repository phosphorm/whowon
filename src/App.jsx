import React, { useState } from "react";
import "./App.css";

function App() {
  const [rawData, setRawData] = useState("");
  const [winningNumber, setWinningNumber] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState("");
  const [tieMode, setTieMode] = useState("first"); // "first" or "all"
  const [winners, setWinners] = useState([]);
  const [timestamp, setTimestamp] = useState("");

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
    const entries = parseRawData(rawData);
    const target = parseFloat(winningNumber);
    const winnersCount = parseInt(numberOfWinners, 10);

    if (isNaN(target) || isNaN(winnersCount) || winnersCount < 1) {
      alert("Please enter valid numbers for Winning Number and Number of Winners.");
      return;
    }

    // Sort entries based on the absolute difference from the target.
    // If two entries are equally close, the one with the lower index comes first.
    const sortedEntries = entries.sort((a, b) => {
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
        const thresholdDiff = Math.abs(selectedWinners[selectedWinners.length - 1].number - target);
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
    setWinners([]);
    setTimestamp("");
  };

  // Prepare winners text in the desired format
  const winnersText = winners
    .map(winner => `:W: ${winner.name || "No Name"} - ${winner.number} :W:`)
    .join("\n");

  // Prepare original data text
  const originalDataText = winners
    .map(winner => winner.original)
    .join("\n");

  return (
    <div className="App">
      <h1>Closest Number Picker</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="rawData">Raw Data:</label>
          <br />
          <textarea
            id="rawData"
            rows="10"
            cols="50"
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            placeholder="Paste your raw data here..."
          />
        </div>
        <div>
          <label htmlFor="winningNumber">Winning Number:</label>
          <br />
          <input
            id="winningNumber"
            type="text"
            value={winningNumber}
            onChange={(e) => setWinningNumber(e.target.value)}
            placeholder="Enter winning number"
          />
        </div>
        <div>
          <label htmlFor="numberOfWinners">Number of Winners:</label>
          <br />
          <input
            id="numberOfWinners"
            type="number"
            value={numberOfWinners}
            onChange={(e) => setNumberOfWinners(e.target.value)}
            placeholder="Enter number of winners"
            min="1"
          />
        </div>
        <div className="tie-mode">
          <p><strong>Tie Handling:</strong></p>
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
        <button type="submit">Pick Winners</button>
        <button type="button" onClick={handleReset} style={{ marginLeft: "10px" }}>
          Reset
        </button>
      </form>

      {winners.length > 0 && (
        <div className="results">
          <h2>Winners Generated</h2>
          <p><strong>Timestamp:</strong> {timestamp}</p>
          <label htmlFor="winnersOutput">Winners Output:</label>
          <textarea
            id="winnersOutput"
            readOnly
            rows="5"
            cols="50"
            value={winnersText}
          />
          <br />
          <label htmlFor="originalOutput">Original Data for Each Winner:</label>
          <textarea
            id="originalOutput"
            readOnly
            rows="5"
            cols="50"
            value={originalDataText}
          />
        </div>
      )}
    </div>
  );
}

export default App;
