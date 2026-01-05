import React, { useMemo, useState } from "react";
import "./App.css";

/**
 * Normalize an operator symbol to the internal representation.
 * We support common UI symbols and map them to + - * /
 */
function normalizeOperator(op) {
  if (op === "×") return "*";
  if (op === "÷") return "/";
  if (op === "−") return "-";
  return op;
}

/**
 * Perform a single binary operation.
 * Returns a string result, or "Error" for invalid operations (e.g., divide by zero).
 */
function computeBinary(aStr, op, bStr) {
  const a = Number(aStr);
  const b = Number(bStr);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return "Error";

  switch (op) {
    case "+":
      return String(a + b);
    case "-":
      return String(a - b);
    case "*":
      return String(a * b);
    case "/":
      if (b === 0) return "Error";
      return String(a / b);
    default:
      return "Error";
  }
}

/**
 * Format a result for display:
 * - Trim trailing zeros in decimals
 * - Avoid scientific notation for typical calculator use (within reason)
 */
function formatForDisplay(valueStr) {
  if (valueStr === "Error") return "Error";
  if (valueStr === "") return "0";

  const n = Number(valueStr);
  if (!Number.isFinite(n)) return "Error";

  // Keep integers as-is
  if (Number.isInteger(n)) return String(n);

  // Limit precision to keep UI stable; then trim trailing zeros
  const fixed = n.toPrecision(12); // reasonable for a simple calculator
  // Convert back to number to normalize forms like "1.23000000000"
  const normalized = String(Number(fixed));

  return normalized;
}

function isDigit(label) {
  return /^[0-9]$/.test(label);
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Calculator state:
   * - display: current entry shown
   * - prev: stored left operand when an operator is active
   * - op: active operator (+ - * /) or null
   * - overwrite: if true, next digit replaces display (after equals or operator selection)
   */
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [overwrite, setOverwrite] = useState(true);

  const displayValue = useMemo(() => {
    // If display is "Error", show it verbatim.
    if (display === "Error") return "Error";
    return formatForDisplay(display);
  }, [display]);

  const resetAll = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setOverwrite(true);
  };

  const handleDigit = (digit) => {
    if (display === "Error") {
      // Starting fresh after an error
      setDisplay(digit);
      setOverwrite(false);
      setPrev(null);
      setOp(null);
      return;
    }

    if (overwrite) {
      setDisplay(digit);
      setOverwrite(false);
      return;
    }

    if (display === "0") {
      setDisplay(digit);
      return;
    }

    setDisplay((d) => d + digit);
  };

  const handleDecimal = () => {
    if (display === "Error") {
      setDisplay("0.");
      setOverwrite(false);
      setPrev(null);
      setOp(null);
      return;
    }

    if (overwrite) {
      setDisplay("0.");
      setOverwrite(false);
      return;
    }

    if (display.includes(".")) return;
    setDisplay((d) => d + ".");
  };

  const handleBackspace = () => {
    if (display === "Error") {
      resetAll();
      return;
    }

    if (overwrite) {
      // If we're in overwrite mode, backspace behaves like clearing entry.
      setDisplay("0");
      setOverwrite(true);
      return;
    }

    if (display.length <= 1) {
      setDisplay("0");
      setOverwrite(true);
      return;
    }

    const next = display.slice(0, -1);
    // Handle dangling "-" becoming empty
    if (next === "-" || next === "") {
      setDisplay("0");
      setOverwrite(true);
      return;
    }

    setDisplay(next);
  };

  const handleToggleSign = () => {
    if (display === "Error") {
      resetAll();
      return;
    }

    // Toggle sign of current display value
    if (display === "0" || display === "0.") return;

    if (display.startsWith("-")) setDisplay(display.slice(1));
    else setDisplay("-" + display);
  };

  const handlePercent = () => {
    if (display === "Error") {
      resetAll();
      return;
    }

    const n = Number(display);
    if (!Number.isFinite(n)) {
      setDisplay("Error");
      setOverwrite(true);
      setPrev(null);
      setOp(null);
      return;
    }

    const result = String(n / 100);
    setDisplay(result);
    // Continue editing this number
    setOverwrite(false);
  };

  const handleOperator = (rawOp) => {
    const nextOp = normalizeOperator(rawOp);

    if (display === "Error") {
      // Ignore operator presses in error state; require clear or digit to recover
      return;
    }

    // If no previous operand stored yet, store current display and set op.
    if (prev === null) {
      setPrev(display);
      setOp(nextOp);
      setOverwrite(true);
      return;
    }

    // If we already have prev and op:
    // - If user just pressed operator (overwrite=true), update operator without computing.
    if (overwrite) {
      setOp(nextOp);
      return;
    }

    // Compute chained operation: prev (op) display
    const result = computeBinary(prev, op, display);
    if (result === "Error") {
      setDisplay("Error");
      setPrev(null);
      setOp(null);
      setOverwrite(true);
      return;
    }

    setPrev(result);
    setDisplay(result);
    setOp(nextOp);
    setOverwrite(true);
  };

  const handleEquals = () => {
    if (display === "Error") {
      resetAll();
      return;
    }
    if (prev === null || op === null) return;

    // If user hits '=' right after choosing op (overwrite=true), treat as no-op.
    // Many calculators repeat the last operand; not required here.
    if (overwrite) {
      const result = computeBinary(prev, op, prev);
      if (result === "Error") {
        setDisplay("Error");
        setPrev(null);
        setOp(null);
        setOverwrite(true);
        return;
      }
      setDisplay(result);
      setPrev(null);
      setOp(null);
      setOverwrite(true);
      return;
    }

    const result = computeBinary(prev, op, display);
    if (result === "Error") {
      setDisplay("Error");
      setPrev(null);
      setOp(null);
      setOverwrite(true);
      return;
    }

    setDisplay(result);
    setPrev(null);
    setOp(null);
    setOverwrite(true);
  };

  const onButtonPress = (label) => {
    if (isDigit(label)) {
      handleDigit(label);
      return;
    }

    switch (label) {
      case "AC":
        resetAll();
        return;
      case "⌫":
        handleBackspace();
        return;
      case ".":
        handleDecimal();
        return;
      case "±":
        handleToggleSign();
        return;
      case "%":
        handlePercent();
        return;
      case "+":
      case "−":
      case "×":
      case "÷":
        handleOperator(label);
        return;
      case "=":
        handleEquals();
        return;
      default:
        return;
    }
  };

  const buttons = [
    ["AC", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "⌫", "="],
  ];

  return (
    <div className="App">
      <main className="app-shell">
        <section className="calculator" aria-label="Calculator">
          <div className="display" aria-label="Display" role="status">
            <div className="display-top" aria-hidden="true">
              <span className="display-op">{op ? op : ""}</span>
              <span className="display-prev">
                {prev !== null && op !== null ? formatForDisplay(prev) : ""}
              </span>
            </div>
            <div className="display-main" data-testid="display">
              {displayValue}
            </div>
          </div>

          <div className="keypad" role="group" aria-label="Calculator keypad">
            {buttons.flat().map((label) => {
              const normalized = normalizeOperator(label);
              const isOperator = ["+", "-", "*", "/"].includes(normalized);
              const isEquals = label === "=";
              const isAction = ["AC", "±", "%", "⌫"].includes(label);

              const className = [
                "key",
                isOperator ? "key-operator" : "",
                isEquals ? "key-equals" : "",
                isAction ? "key-action" : "",
                label === "0" ? "key-zero" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={label}
                  type="button"
                  className={className}
                  onClick={() => onButtonPress(label)}
                  aria-label={label === "⌫" ? "Backspace" : label}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <p className="hint" aria-hidden="true">
            Tip: AC clears all, ⌫ removes one character.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
