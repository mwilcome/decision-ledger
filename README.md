# Decision Ledger

A browser side panel for **your own code-review notes** while you look at pull requests.

Write down questions, risks, blockers, and decisions as you go. Notes stay on **your computer** (this browser profile). They are not posted to GitHub and not uploaded to a server.

---

## What you can do

- Open a GitHub pull request and see which change the panel is attached to
- Save notes on the **whole PR** or on a **specific commit**
- Mark notes as in progress, waiting for clarification, or settled
- Filter: this PR, this commit only, or everything you’ve saved
- Edit or delete notes; settle all open notes on a PR when you’re done
- Click the PR or commit label to open it in a new tab
- Switch browser tabs and the panel follows the active PR

Colors help at a glance: open items lean orange; settled items lean green.

---

## What works today

| | Supported now |
|--|----------------|
| **Browser** | Chrome and other Chromium browsers (Edge, Brave, etc.) |
| **Site** | [github.com](https://github.com) pull requests |
| **Data** | Local only (IndexedDB in your browser) |

### Not in this iteration

- Firefox or Safari
- GitLab, Bitbucket, Azure DevOps, or self-hosted GitHub Enterprise (as a supported product)
- Cloud sync or sharing notes with teammates
- Publishing notes as GitHub review comments

If something outside this list doesn’t work, that’s expected for now.

---

## Install (load it yourself)

This is not published on the Chrome Web Store yet. You build a local copy and load it as an unpacked extension.

### You need

- [Node.js](https://nodejs.org/) (current LTS is fine)
- Chrome (or another Chromium browser)
- This project on your machine

### Steps (Windows)

In PowerShell:

```powershell
cd path\to\decision-ledger
npm.cmd install
npm.cmd run build
```

Then in Chrome:

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Choose the folder: `apps\extension\dist`

Pin **Decision Ledger** from the extensions menu, open a GitHub PR, and open the side panel (extension icon).

### After you change the code

```powershell
npm.cmd run build
```

Then click **Reload** on the extension card at `chrome://extensions`.

---

## Privacy

- Notes stay in your browser profile on this device.
- The extension only needs access to GitHub pages it runs on, plus storage for your notes.
- There is no account and no backend service for notes.

---

## Tips

- Open a **single commit** in the PR (Files / changes for that commit) to attach a note to that commit.
- Use **All** to see notes across PRs; use **This page only** (or **This PR**) to focus again.
- Titles for PRs are learned when you visit the PR page; until then you may see `#N · owner/repo`.

---

## Who maintains this

Built for personal use by [Mike Wilcome](https://github.com/mwilcome).
