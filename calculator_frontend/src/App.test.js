import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

function press(label) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

test("renders calculator display and keypad", () => {
  render(<App />);
  expect(screen.getByLabelText(/calculator/i)).toBeInTheDocument();
  expect(screen.getByTestId("display")).toHaveTextContent("0");
  expect(screen.getByRole("button", { name: "AC" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "÷" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "=" })).toBeInTheDocument();
});

test("basic digit entry and clear", () => {
  render(<App />);
  press("1");
  press("2");
  press("3");
  expect(screen.getByTestId("display")).toHaveTextContent("123");

  press("AC");
  expect(screen.getByTestId("display")).toHaveTextContent("0");
});

test("decimal handling prevents multiple decimals", () => {
  render(<App />);
  press("1");
  press(".");
  press("2");
  press(".");
  press("3");
  expect(screen.getByTestId("display")).toHaveTextContent("1.23");
});

test("backspace removes one character and returns to 0 when empty", () => {
  render(<App />);
  press("9");
  press("8");
  press("7");
  expect(screen.getByTestId("display")).toHaveTextContent("987");

  press("Backspace");
  expect(screen.getByTestId("display")).toHaveTextContent("98");

  press("Backspace");
  press("Backspace");
  expect(screen.getByTestId("display")).toHaveTextContent("0");
});

test("evaluates addition and chained operations", () => {
  render(<App />);
  // 12 + 7 = 19
  press("1");
  press("2");
  press("+");
  press("7");
  press("=");
  expect(screen.getByTestId("display")).toHaveTextContent("19");

  // chain: 5 × 6 − 4 = 26
  press("AC");
  press("5");
  press("×");
  press("6");
  press("−");
  press("4");
  press("=");
  expect(screen.getByTestId("display")).toHaveTextContent("26");
});

test("toggle sign and percent work on current entry", () => {
  render(<App />);
  press("5");
  press("±");
  expect(screen.getByTestId("display")).toHaveTextContent("-5");

  press("%");
  expect(screen.getByTestId("display")).toHaveTextContent("-0.05");
});

test("divide by zero shows Error and recovers on AC", () => {
  render(<App />);
  press("8");
  press("÷");
  press("0");
  press("=");
  expect(screen.getByTestId("display")).toHaveTextContent("Error");

  press("AC");
  expect(screen.getByTestId("display")).toHaveTextContent("0");
});
