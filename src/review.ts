import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
dotenv.config();

const client = new Anthropic();

const TEST_CODE = `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i <= items.length; i++) {
    total += items[i].price;
  }
  return total;
}

function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  return db.execute(query);
}

async function fetchData(url) {
  const response = await fetch(url);
  const data = response.json();
  return data;
}
`;

async function reviewCode(code: string): Promise<void> {
  console.log("Sending code to Claude for review...\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an expert code reviewer. Review the following code and identify bugs, security issues, and improvements.

For each issue found, provide:
- The line or function where the issue is
- Severity: HIGH, MEDIUM, or LOW
- What the issue is
- How to fix it

Code to review:
\`\`\`javascript
${code}
\`\`\`

Be specific and actionable.`,
      },
    ],
  });

  console.log("=== CODE REVIEW RESULTS ===\n");
  console.log(message.content[0].type === "text" ? message.content[0].text : "");
  console.log("\n=== END OF REVIEW ===");
}

reviewCode(TEST_CODE);
