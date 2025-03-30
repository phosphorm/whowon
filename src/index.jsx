import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

/**
 * 1) Set the document title to "who won?"
 * 2) Dynamically create a link element for the favicon (emoji_events trophy icon),
 *    in green (#00ff00).
 */
document.title = "who won?";

const trophySVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#00ff00" viewBox="0 0 24 24">
  <path d="M19 2H5c-.55 0-1 .45-1 1v4c0 1.66 1.34 
  3 3 3h.28c.6 2.34 2.85 4 5.39 4s4.79-1.66 5.39-4H17c1.66 
  0 3-1.34 3-3V3c0-.55-.45-1-1-1zm-2 5c0 1.1-.9 2-2 
  2h-6c-1.1 0-2-.9-2-2V4h10v3zM4 14h16c.55 0 1 .45 
  1 1v1c0 2.14-1.72 3.9-3.9 3.99a1 1 0 0 0-.95 
  1.04v1c0 .55-.45 1-1 1H8c-.55 
  0-1-.45-1-1v-1a1 1 0 0 0-.95-1.04C4.78 
  19.9 3 18.14 3 16v-1c0-.55.45-1 1-1z"/>
</svg>
`);

const link = document.createElement("link");
link.rel = "icon";
link.type = "image/svg+xml";
link.href = `data:image/svg+xml,${trophySVG}`;
document.head.appendChild(link);

ReactDOM.render(<App />, document.getElementById("root"));