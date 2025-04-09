# AI Browser Automation Agent

An autonomous AI agent that controls a web browser to perform complex tasks, using natural language commands. It can navigate websites, click elements, fill forms, handle logins, and more — all through an interactive chat interface.

---

## Features

- **Interactive Chat Loop:** Persistent conversation with the agent, issuing multiple commands in sequence.
- **Browser Automation:** Navigate, click, type, login, close overlays, and more.
- **Overlay Removal:** Automatically detects and removes popups and overlays after navigation.
- **Stealth Mode:** Masks automation fingerprints to reduce bot detection and avoid CAPTCHAs.
- **Fallback Click:** If a click fails, the agent tries pressing Enter on the element.
- **Supports Chrome and Chromium:** Uses Playwright for browser control.
- **Extensible Tools:** Easily add new tools for custom actions.

---

## Architecture

- **LangChain Agent:** Handles conversation, tool calling, and reasoning.
- **Tools:** Modular actions like `navigate_to_url`, `click_element`, `type_text`, `login_with_google`, etc.
- **Playwright Browser Manager:** Launches and controls a Chromium/Chrome browser instance.
- **Overlay Remover:** Cleans up popups automatically after navigation.
- **Chat Loop:** Runs in terminal, accepts commands, and executes them sequentially.

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repo-url>
cd ai-agent
```

### 2. Install dependencies

```bash
bun install
```

### 3. Environment Variables

Create a `.env` file with your API keys and settings:

```
OPENAI_API_KEY=your-openai-or-openrouter-key
OPENAI_BASE_URL=https://openrouter.ai/api/v1 (if using OpenRouter)
OPENAI_MODEL=openrouter/quasar-alpha (or your preferred model)
```

### 4. Run the agent

```bash
bun run index.ts
```

The agent will start a chat loop. Type your commands, e.g.:

```
navigate to https://www.flipkart.com
click the login button
type my username and password
search for red nike shoes under 4000
```

Type `exit` to quit.

---

## How It Works

1. **Chat Loop:** The agent prompts you for commands continuously.
2. **LangChain Agent:** Parses your input, decides which tool(s) to call.
3. **Tools:** Execute browser actions via Playwright.
4. **Browser Automation:**
   - Launches a visible Chromium window.
   - Navigates to URLs.
   - Clicks elements (with Enter fallback).
   - Types into fields.
   - Logs in via OAuth or username/password.
   - Removes overlays automatically.
5. **Stealth Mode:** Modifies browser properties to avoid detection.
6. **Response:** The agent summarizes what it did and waits for the next command.

---

## Extending the Agent

- **Add New Tools:** Create new classes extending `StructuredTool` in `src/tools/`.
- **Modify Prompts:** Update the system prompt in `src/agent/agent.ts`.
- **Change Browser Behavior:** Edit `src/core/browser.ts` for Playwright settings.
- **Switch Models:** Change `OPENAI_MODEL` in `.env`.

---

## Dependencies

- [LangChain](https://github.com/hwchase17/langchain)
- [Playwright](https://playwright.dev/)
- [Bun](https://bun.sh/)
- [OpenAI API](https://platform.openai.com/) or [OpenRouter](https://openrouter.ai/)

---

## License

MIT License
