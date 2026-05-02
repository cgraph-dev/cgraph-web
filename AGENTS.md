# Agent Rules

## Git Identity

All automated agents must use the project identity for commits:

```sh
git config user.name cgraph-dev
git config user.email contact@cgraph.org
```

Do not add AI attribution trailers to commit messages. In particular, do not add
`Co-authored-by`, `Generated-by`, `Assisted-by`, or similar lines for Claude,
Codex, ChatGPT, OpenAI, Anthropic, Copilot, Cursor, or any other AI assistant.
VS Code workspace setting `git.addAICoAuthor` is intentionally set to `off`.

Commits from this repository should appear on GitHub as:

```text
cgraph-dev <contact@cgraph.org>
```
