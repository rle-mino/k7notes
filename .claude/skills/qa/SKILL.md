---
name: qa
description: Interactive QA testing of the K7Notes app on web (Chrome DevTools) or mobile (iOS Simulator). Starts servers, logs in, and performs manual testing.
argument-hint: <web|mobile> [what to test]
allowed-tools: Read, Grep, Glob, Bash, mcp__chrome-devtools__navigate_page, mcp__chrome-devtools__take_snapshot, mcp__chrome-devtools__take_screenshot, mcp__chrome-devtools__click, mcp__chrome-devtools__fill, mcp__chrome-devtools__fill_form, mcp__chrome-devtools__hover, mcp__chrome-devtools__press_key, mcp__chrome-devtools__wait_for, mcp__chrome-devtools__evaluate_script, mcp__chrome-devtools__list_pages, mcp__chrome-devtools__select_page, mcp__chrome-devtools__new_page, mcp__chrome-devtools__list_console_messages, mcp__chrome-devtools__get_console_message, mcp__chrome-devtools__list_network_requests, mcp__chrome-devtools__get_network_request, mcp__chrome-devtools__handle_dialog, mcp__ios-simulator__open_simulator, mcp__ios-simulator__get_booted_sim_id, mcp__ios-simulator__ui_describe_all, mcp__ios-simulator__ui_tap, mcp__ios-simulator__ui_type, mcp__ios-simulator__ui_swipe, mcp__ios-simulator__ui_describe_point, mcp__ios-simulator__ui_view, mcp__ios-simulator__screenshot, mcp__ios-simulator__launch_app, mcp__ios-simulator__install_app
---

## QA Testing Skill for K7Notes

You are a QA tester for the K7Notes app. Your job is to interactively test the application using browser DevTools (web) or iOS Simulator (mobile).

## Arguments

- `$ARGUMENTS`
- First argument (`$0`): **platform** — must be `web` or `mobile`
- Remaining arguments: **what to test** (optional — if omitted, perform a full smoke test)

## Credentials

Read the credentials file at the project root:

```
credentials
```

Format: `email;password` (one line). Parse it to extract the login email and password.

## Startup Procedure

### 1. Check Docker / PostgreSQL

```bash
docker ps --filter "name=k7notes-postgres" --format "{{.Status}}"
```

If not running, start it:

```bash
docker compose -f packages/stack-k7/docker-compose.yml up -d
```

Wait for it to be healthy (retry up to 10 times with 2s sleep):

```bash
docker exec k7notes-postgres pg_isready -U postgres
```

### 2. Check if servers are already running

```bash
lsof -ti :4000  # API
lsof -ti :4001  # Expo
```

If servers are already running on both ports, skip to step 4.

### 3. Start servers in background

Start the API server (port 4000):

```bash
cd /Users/rle/Projects/k7notes && pnpm turbo dev --filter=@k7notes/api
```

Run this in background using `run_in_background: true` on the Bash tool.

Start the Expo web server (port 4001) — for **web** platform:

```bash
cd /Users/rle/Projects/k7notes && pnpm turbo start --filter=@k7notes/mobile -- --web
```

Run this in background using `run_in_background: true` on the Bash tool.

For **mobile** platform, start the Expo dev server instead:

```bash
cd /Users/rle/Projects/k7notes && pnpm turbo start --filter=@k7notes/mobile
```

Run this in background using `run_in_background: true` on the Bash tool.

### 4. Wait for servers to be ready

Poll until servers respond (retry up to 30 times, 2s between attempts):

- API: `curl -sf http://localhost:4000/health`
- Web: `curl -sf http://localhost:4001`

Only proceed once both return successfully.

## Platform: Web (chrome-devtools)

### Opening the app

1. Use `mcp__chrome-devtools__list_pages` to see open pages
2. Use `mcp__chrome-devtools__navigate_page` to go to `http://localhost:4001`
3. Use `mcp__chrome-devtools__wait_for` to wait for "Sign in to continue"

### Login

1. Take a snapshot with `mcp__chrome-devtools__take_snapshot` to see the page structure
2. Fill the login form using `mcp__chrome-devtools__fill_form` with the credentials:
   - Find the Email input and fill with the email from credentials
   - Find the Password input and fill with the password from credentials
3. Click the "Sign In" button. **IMPORTANT**: React Native Web renders buttons as `div[tabindex="0"]`, not `<button>`. Use `mcp__chrome-devtools__click` on the correct element.
4. Wait for navigation to the notes page with `mcp__chrome-devtools__wait_for` — look for "Notes" heading

### Testing (web)

Use these tools for interactive testing:

- **Snapshot** (`take_snapshot`): Get the page structure as an accessibility tree — use this to find elements by their uid
- **Screenshot** (`take_screenshot`): Visual check of what the page looks like
- **Click** (`click`): Click elements by uid from the snapshot
- **Fill** (`fill` / `fill_form`): Type into inputs
- **Press key** (`press_key`): Keyboard shortcuts or Enter key
- **Wait** (`wait_for`): Wait for text to appear after actions
- **Console** (`list_console_messages`): Check for errors in the console
- **Network** (`list_network_requests`): Monitor API calls
- **Navigate** (`navigate_page`): Go to specific URLs

**Workflow for each test action:**

1. Take a snapshot to understand current page state
2. Perform the action (click, fill, navigate)
3. Wait for expected result
4. Take a snapshot or screenshot to verify the outcome
5. Check console for errors after each major action

## Platform: Mobile (ios-simulator)

### Opening the app

1. Use `mcp__ios-simulator__open_simulator` to ensure the simulator is running
2. Use `mcp__ios-simulator__get_booted_sim_id` to get the simulator UDID
3. Launch the Expo Go app or the K7Notes dev build:
   - Use `mcp__ios-simulator__launch_app` with `bundle_id: "host.exp.Exponent"` for Expo Go
4. Wait a moment for the app to load, then use `mcp__ios-simulator__ui_view` to see the screen

### Login (mobile)

1. Use `mcp__ios-simulator__ui_describe_all` to get the accessibility tree
2. Tap on the Email field and type the email from credentials using `ui_tap` + `ui_type`
3. Tap on the Password field and type the password
4. Tap the "Sign In" button
5. Wait and verify with `ui_view` or `ui_describe_all` that you're on the notes screen

### Testing (mobile)

Use these tools for interactive testing:

- **View** (`ui_view`): Get a compressed screenshot of the current screen
- **Describe all** (`ui_describe_all`): Get accessibility information for all elements on screen
- **Describe point** (`ui_describe_point`): Get info about element at specific coordinates
- **Tap** (`ui_tap`): Tap at x,y coordinates
- **Type** (`ui_type`): Input text (must tap a field first)
- **Swipe** (`ui_swipe`): Scroll or swipe gestures
- **Screenshot** (`screenshot`): Take a full screenshot and save to file

**Workflow for each test action:**

1. Use `ui_describe_all` to understand current screen state and find element positions
2. Tap the target element at its coordinates
3. Wait briefly, then use `ui_view` to verify the result
4. If something went wrong, use `ui_describe_all` to debug

## App Structure Reference

### Routes

| URL | Description |
|-----|-------------|
| `/login` | Login page — "Sign in to continue" |
| `/signup` | Signup page — "Sign up to get started" |
| `/notes` | Notes list — folder tree view |
| `/notes/new` | Create new note |
| `/notes/[id]` | Edit existing note |
| `/notes/folder/[id]` | View folder contents |
| `/search` | Full-text search |
| `/recents` | Recently modified notes |
| `/settings` | User settings and sign out |

### UI Elements

**Login page:**
- Email input (placeholder: "Email")
- Password input (placeholder: "Password")
- "Sign In" button
- "Sign in with Google" button
- "Sign up" link

**Notes page:**
- "Notes" heading
- Folder+ icon button (yellow) — create folder
- File+ icon button (blue) — create note
- Tree view of folders and notes
- Empty state: "No notes yet"

**Web sidebar (web only):**
- "K7Notes" logo
- Notes, Search, Recents, Settings nav items

**Mobile tab bar (mobile only):**
- Notes, Search, Recents, Settings tabs
- Center floating + button (create note/audio)

**Settings page:**
- Account section (name, email)
- "Sign Out" button (red)

## Default Smoke Test

If no specific test is requested, perform this smoke test sequence:

1. **Login**: Log in with credentials, verify notes page loads
2. **Create folder**: Create a folder named "QA Test Folder"
3. **Create note**: Create a text note titled "QA Test Note" with some content
4. **Verify tree**: Check the folder and note appear in the tree
5. **Search**: Navigate to search page, search for "QA Test"
6. **Recents**: Navigate to recents, verify the note appears
7. **Settings**: Navigate to settings, verify account info is displayed
8. **Cleanup**: Delete the test note and folder if possible
9. **Report**: Summarize all findings — what passed, what failed, any console errors

## Reporting

After testing, provide a clear summary:

```
## QA Report — [web|mobile]

### Tests Performed
- [ ] Test 1: description — PASS/FAIL
- [ ] Test 2: description — PASS/FAIL

### Issues Found
- Issue 1: description + screenshot if relevant

### Console Errors
- Any errors seen in console (web) or logs

### Notes
- Any observations about UX, performance, or behavior
```

Always take screenshots for any failures.
