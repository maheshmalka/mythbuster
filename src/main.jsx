import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MythBuster from "../mythbuster.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MythBuster />
  </StrictMode>
);
