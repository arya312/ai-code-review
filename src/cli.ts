import { reviewCode, formatReview } from "./review.js";
import { readFile } from "./diff.js";
import * as path from "path";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npx ts-node src/cli.ts <file>");
    console.log("Example: npx ts-node src/cli.ts src/mycode.js");
    process.exit(1);
  }

  const filepath = args[0];

  if (!filepath) {
    console.error("Please provide a file path");
    process.exit(1);
  }

  console.log(`\nReviewing ${filepath}...`);

  try {
    const code = readFile(filepath);
    const filename = path.basename(filepath);
    const result = await reviewCode(code, filename);
    console.log(formatReview(result, filename));

    // Exit with error code if HIGH severity issues found
    const highIssues = result.issues.filter(i => i.severity === "HIGH");
    if (highIssues.length > 0) {
      console.log(`\n❌ Review failed: ${highIssues.length} HIGH severity issue(s) found`);
      process.exit(1);
    } else {
      console.log("\n✅ Review passed!");
      process.exit(0);
    }
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
