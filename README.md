# AI Code Review

An AI-powered code reviewer built with Claude. Reviews any JavaScript or TypeScript file for bugs, security vulnerabilities, and code quality issues.

## Live demo

Try it right now on any JS/TS file:

```bash
npx ai-review-claude src/yourfile.js
```

Example output:
CODE REVIEW: yourfile.js
Score: 4/10

🔴 [HIGH] getUserData
Line: "SELECT * FROM users WHERE id = " + userId
Issue: SQL injection vulnerability
Fix: Use parameterized queries: db.execute("SELECT * FROM users WHERE id = ?", [userId])
🟡 [MEDIUM] fetchData
Line: "const data = response.json()"
Issue: Missing await — returns a Promise instead of data
Fix: const data = await response.json()

Summary: 1 HIGH, 1 MEDIUM
❌ Review failed: 1 HIGH severity issue(s) found

---

## Option 1 — Run locally on any file

### Install
```bash
npm install -g ai-review-claude
```

### Use
```bash
ai-review src/myfile.js
ai-review utils/helpers.ts
```

You need an Anthropic API key. Get one free at [console.anthropic.com](https://console.anthropic.com).

```bash
export ANTHROPIC_API_KEY="your_key_here"
ai-review src/myfile.js
```

Exit code 0 = no HIGH issues. Exit code 1 = HIGH issues found. Works in any CI pipeline.

---

## Option 2 — Automatic GitHub PR reviews

Add AI code review to any GitHub repo in 3 steps.

### Step 1: Add the workflow file

Create `.github/workflows/ai-review.yml` in your repo:

```yaml
name: AI Code Review
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Get changed files
        id: changed
        run: |
          echo "files=$(git diff --name-only origin/${{ github.base_ref }}...HEAD | grep -E '\.(js|ts)$' | head -5 | tr '\n' ' ')" >> $GITHUB_OUTPUT
      - name: Run AI review
        if: steps.changed.outputs.files != ''
        run: |
          npx ai-review-claude ${{ steps.changed.outputs.files }} 2>&1 | tee review_output.txt
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        continue-on-error: true
      - name: Post comment
        if: steps.changed.outputs.files != ''
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const output = fs.readFileSync('review_output.txt', 'utf8');
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## 🤖 AI Code Review\n\`\`\`\n${output}\n\`\`\``
            });
```

### Step 2: Add your API key

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

- Name: `ANTHROPIC_API_KEY`
- Value: your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

### Step 3: Open a PR

That's it. Every PR on `.js` or `.ts` files will automatically get a review comment posted.

---

## Try it on this repo

Want to see it in action? This repo uses its own reviewer:

1. Fork this repo
2. Add `ANTHROPIC_API_KEY` to your fork's secrets
3. Make any change to a `.js` or `.ts` file
4. Open a PR → watch the review appear automatically

---

## What it detects

| Category | Examples |
|---|---|
| Security | SQL injection, eval() usage, passwords in localStorage, XSS |
| Bugs | Off-by-one errors, missing await, division by zero, null dereference |
| Code quality | Missing error handling, sync operations in async functions, no input validation |
| Each issue | Severity (HIGH/MEDIUM/LOW), exact location, specific fix with corrected code |

---

## Tech stack

- **Claude** (Anthropic) — LLM for code analysis
- **Anthropic Tool Use** — structured JSON output (not free text)
- **TypeScript** — type-safe codebase
- **GitHub Actions** — CI/CD integration

---

## Why structured output matters

Most AI tools return free text. This tool uses Anthropic's tool use API to return structured JSON:

```json
{
  "severity": "HIGH",
  "function_name": "getUserData", 
  "issue": "SQL injection vulnerability",
  "fix": "Use parameterized queries"
}
```

Structured output means the reviewer can post formatted GitHub comments, integrate with JIRA, trigger Slack alerts, or block deployments. Free text can't do any of that.

---

## npm

[npmjs.com/package/ai-review-claude](https://npmjs.com/package/ai-review-claude)

Built by [arya312](https://github.com/arya312)
