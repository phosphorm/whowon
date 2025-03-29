import React, { useState } from "react";
import "./App.css";

function App() {
  const [rawData, setRawData] = useState("");
  const [winningNumber, setWinningNumber] = useState("");
  const [numberOfWinners, setNumberOfWinners] = useState("");
  const [whitelistText, setWhitelistText] = useState("");
  const [dedupOption, setDedupOption] = useState("first"); // "first" or "last"
  const [winners, setWinners] = useState([]);

  const parseRawData = (data) => {
    return data
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, index) => {
        // Extract the first number-like pattern (supports comma or dot)
        const match = line.match(/([-+]?[0-9]*[.,]?[0-9]+)/);
        if (match) {
          // Replace comma with dot and parse as float
          const numberValue = parseFloat(match[0].replace(",", "."));
          // Remove the number from the line to isolate the name
          const name = line.replace(match[0], "").trim();
          return { name, number: numberValue, original: line, index };
        }
        return null;
      })
      .filter(item => item !== null);
  };

  // Deduplicate entries for names in the whitelist
  const deduplicateEntries = (entries) => {
    // Parse the whitelist input into an array of lowercased names
    const whitelist = whitelistText
      .split(/[\n,]+/)
      .map(name => name.trim().toLowerCase())
      .filter(name => name.length > 0);

    // Create a map for whitelisted names and collect non-whitelisted entries separately.
    const deduped = [];
    const groups = {};

    entries.forEach((entry) => {
      const entryName = entry.name.toLowerCase();
      if (whitelist.includes(entryName)) {
        if (!groups[entryName]) {
          groups[entryName] = [];
        }
        groups[entryName].push(entry);
      } else {
        // For names not in the whitelist, include every submission.
        deduped.push(entry);
      }
    });

    // Process each group from the whitelist.
    Object.values(groups).forEach(group => {
      if (group.length === 1) {
        deduped.push(group[0]);
      } else {
        // Choose the first or last submission based on toggle.
        if (dedupOption === "first") {
          // The group was built in the order of appearance
          deduped.push(group[0]);
        } else {
          deduped.push(group[group.length - 1]);
        }
      }
    });

    return deduped;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const entries = parseRawData(rawData);
    const dedupedEntries = deduplicateEntries(entries);
    const target = parseFloat(winningNumber);
    const winnersCount = parseInt(numberOfWinners, 10);

    if (isNaN(target) || isNaN(winnersCount) || winnersCount < 1) {
      alert("Please enter valid numbers for Winning Number and Number of Winners.");
      return;
    }

    // Sort entries based on the absolute difference from the target.
    const sortedEntries = dedupedEntries.sort((a, b) =>
      Math.abs(a.number - target) - Math.abs(b.number - target)
    );

    // Slice the sorted array to get the desired number of winners.
    setWinners(sortedEntries.slice(0, winnersCount));
  };

  const handleReset = () => {
    setRawData("");
    setWinningNumber("");
    setNumberOfWinners("");
    setWhitelistText("");
    setDedupOption("first");
    setWinners([]);
  };

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
        <div>
          <label htmlFor="whitelist">Whitelist (names to deduplicate):</label>
          <br />
          <textarea
            id="whitelist"
            rows="3"
            cols="50"
            value={whitelistText}
            onChange={(e) => setWhitelistText(e.target.value)}
            placeholder="Enter names separated by commas or new lines"
          />
        </div>
        <div>
          <label>Duplicate Rule Toggle:</label>
          <br />
          <label>
            <input
              type="radio"
              name="dedupOption"
              value="first"
              checked={dedupOption === "first"}
              onChange={() => setDedupOption("first")}
            />
            First Submission
          </label>
          <label style={{ marginLeft: "10px" }}>
            <input
              type="radio"
              name="dedupOption"
              value="last"
              checked={dedupOption === "last"}
              onChange={() => setDedupOption("last")}
            />
            Last Submission
          </label>
        </div>
        <div style={{ marginTop: "10px" }}>
          <button type="submit">Pick Winners</button>
          <button type="button" onClick={handleReset} style={{ marginLeft: "10px" }}>
            Reset
          </button>
        </div>
      </form>

      {winners.length > 0 && (
        <div>
          <h2>Winners</h2>
          <ul>
            {winners.map((winner, index) => (
              <li key={index}>
                :W: {winner.name || "No Name"} - {winner.number} :W:
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
