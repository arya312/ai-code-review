import Anthropic from "@anthropic-ai/sdk";
import * as dotenv from "dotenv";
dotenv.config();

const client = new Anthropic();

// Define the tool schema — this forces Claude to return structured JSON
const codeReviewTool: Anthropic.Tool = {
  name: "submit_code_review",
  description: "Submit a structured code review with specific issues found",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description: "A 1-2 sentence overall summary of the code quality"
      },
      issues: {
        type: "array",
        items: {
          type: "object",
          properties: {
            severity: {
              type: "string",
              enum: ["HIGH", "MEDIUM", "LOW"],
              description: "Severity of the issue"
            },
            function_name: {
              type: "string",
              description: "The function or block where the issue was found"
            },
            line_hint: {
              type: "string",
              description: "A short quote or description of the problematic line"
            },
            issue: {
              type: "string",
              description: "Clear description of what the problem is"
            },
            fix: {
              type: "string",
              description: "Specific actionable fix with corrected code if applicable"
            }
          },
          required: ["severity", "function_name", "issue", "fix"]
        }
      },
      score: {
        type: "number",
        description: "Overall code quality score from 1-10"
      }
    },
    required: ["summary", "issues", "score"]
  }
};

export interface ReviewIssue {
  severity: "HIGH" | "MEDIUM" | "LOW";
  function_name: string;
  line_hint?: string;
  issue: string;
  fix: string;
}

export interface ReviewResult {
  summary: string;
  issues: ReviewIssue[];
  score: number;
}

export async function reviewCode(code: string, filename: string = "code"): Promise<ReviewResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    tools: [codeReviewTool],
    tool_choice: { type: "any" },
    messages: [
      {
        role: "user",
        content: `You are an expert code reviewer. Review this code from file: ${filename}

Find ALL bugs, security vulnerabilities, performance issues, and code quality problems.
Be thorough — this review will be posted as a GitHub PR comment.

Code:
\`\`\`
${code}
\`\`\``
      }
    ]
  });

  // Extract the tool use result
  const toolUse = message.content.find(block => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a structured review");
  }

  return toolUse.input as ReviewResult;
}

// Pretty print for terminal
export function formatReview(result: ReviewResult, filename: string): string {
  const severityEmoji = { HIGH: "🔴", MEDIUM: "🟡", LOW: "🟢" };
  const lines: string[] = [];

  lines.push(`\n${"=".repeat(60)}`);
  lines.push(`CODE REVIEW: ${filename}`);
  lines.push(`Score: ${result.score}/10`);
  lines.push(`${"=".repeat(60)}`);
  lines.push(`\nSummary: ${result.summary}\n`);

  if (result.issues.length === 0) {
    lines.push("✅ No issues found!");
  } else {
    lines.push(`Found ${result.issues.length} issue(s):\n`);
    result.issues.forEach((issue, i) => {
      lines.push(`${i + 1}. ${severityEmoji[issue.severity]} [${issue.severity}] ${issue.function_name}`);
      if (issue.line_hint) lines.push(`   Line: "${issue.line_hint}"`);
      lines.push(`   Issue: ${issue.issue}`);
      lines.push(`   Fix: ${issue.fix}`);
      lines.push("");
    });
  }

  const high = result.issues.filter(i => i.severity === "HIGH").length;
  const medium = result.issues.filter(i => i.severity === "MEDIUM").length;
  const low = result.issues.filter(i => i.severity === "LOW").length;
  lines.push(`Summary: ${high} HIGH, ${medium} MEDIUM, ${low} LOW`);
  lines.push("=".repeat(60));

  return lines.join("\n");
}
