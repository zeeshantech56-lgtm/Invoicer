import { sanitizeCsvField } from "./csv.js";

const testCases = [
  { input: "=cmd|'/c calc'!A0", expected: "'=cmd|'/c calc'!A0" },
  { input: "+1+2", expected: "'+1+2" },
  { input: "-1+2", expected: "'-1+2" },
  { input: "@SUM(1,1)", expected: "'@SUM(1,1)" },
  { input: "\tHello", expected: "'\tHello" },
  { input: "\rWorld", expected: "'\rWorld" },
  { input: "Normal Text", expected: "Normal Text" },
  { input: 123, expected: "123" },
  { input: null, expected: "" },
  { input: undefined, expected: "" },
];

let failed = false;
for (const tc of testCases) {
  const actual = sanitizeCsvField(tc.input);
  if (actual !== tc.expected) {
    console.error(`FAILED for input: ${tc.input}. Expected: ${tc.expected}, Got: ${actual}`);
    failed = true;
  }
}

if (!failed) {
  console.log("All CSV injection tests passed!");
} else {
  process.exit(1);
}
