# Windows App Scanning Feature

## Overview

The Parental Control PWA now includes a Windows app scanning feature that automatically detects installed applications on your Windows PC and allows you to select them directly from a searchable dropdown list. This eliminates the need to manually type app names.

## How It Works

### Architecture

The feature consists of three main components:

1. **Backend Server (server.js)** - Node.js Express server running on port 3001
2. **AppSelector Component** - React component with searchable dropdown UI
3. **API Client Integration** - Fetches apps from the backend and handles errors

### Backend Server

The backend server (`server.js`) scans your Windows system for installed applications:

- **Program Files Scanning**: Checks `C:\Program Files` and `C:\Program Files (x86)` directories
- **Mock Fallback**: Includes mock data with 25 popular applications for development/testing
- **Error Handling**: Gracefully falls back to mock data if scanning fails

### Frontend Component

The `AppSelector` component provides:

- **Searchable Dropdown**: Real-time filtering of applications as you type
- **Process Names**: Shows both display name and executable name for each app
- **Manual Entry Fallback**: Option to manually enter app names if not found in list
- **Loading State**: Visual feedback while fetching app list
- **Error Recovery**: Switches to manual input mode if backend is unavailable

## Usage

### Starting the Backend

Run the backend server before using the app:

```bash
# Terminal 1 - Start backend
pnpm server

# Terminal 2 - Start frontend
pnpm dev
```

Or start both together:

```bash
pnpm dev:all
```

### Blocking an App

1. Click "Block New App" on the dashboard
2. The modal shows the "Select App" dropdown
3. Click the dropdown to see installed apps
4. Type in the search box to filter (e.g., "Chrome", "Discord")
5. Click an app to select it
6. Choose a duration and click "Block App"

### Manual Entry

If the backend is unavailable or your app isn't in the list:

1. Click "Can't find your app? Enter manually" in the dropdown
2. Type the app name or process name
3. Click "Add" to add it
4. Continue with duration selection

## API Endpoints

### GET /api/installed-apps

Returns a sorted list of installed applications.

**Response:**
```json
[
  {
    "displayName": "Google Chrome",
    "processName": "chrome.exe",
    "path": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  },
  {
    "displayName": "Discord",
    "processName": "Discord.exe",
    "path": "C:\\Users\\Username\\AppData\\Local\\Discord\\app-VERSION\\Discord.exe"
  }
]
```

### GET /api/app/:processName

Returns details for a specific application.

**Example:** `/api/app/chrome.exe`

### GET /api/running-processes

Returns list of currently running processes.

**Response:**
```json
[
  { "name": "chrome.exe", "pid": 1234 },
  { "name": "Discord.exe", "pid": 5678 }
]
```

## Customization

### Adding More Mock Apps

Edit `server.js` `getMockApps()` function to add more applications for testing:

```javascript
function getMockApps() {
  return [
    { displayName: 'Your App', processName: 'yourapp.exe' },
    // ... more apps
  ]
}
```

### Extending the Scanner

To add registry scanning or other detection methods, modify `getInstalledApps()` in `server.js`:

```javascript
async function getInstalledApps() {
  // Add custom scanning logic here
  // Check registry keys, Windows Store apps, etc.
}
```

## Troubleshooting

### Backend not starting
- Ensure Node.js is installed and port 3001 is available
- Check for any error messages in the terminal

### Apps not loading in dropdown
- Verify the backend server is running
- Check browser console for network errors
- The app will automatically switch to manual input mode if backend fails

### Specific app not in list
- Try the manual entry option
- Ensure the application is installed in Program Files
- The backend only scans Program Files directories by default

### Process name incorrect
- Use Task Manager to find the actual .exe name
- Enter it manually using the manual entry option

## Future Enhancements

Potential improvements to the feature:

- Registry scanning for applications installed outside Program Files
- Windows Store / Microsoft Store app detection
- Portable application database
- Application icon extraction
- Running process detection to show "currently active" apps
- Application categories and tags
- Search history

## Technical Notes

- Backend uses synchronous file system operations for simplicity
- Scanning is limited to first 50 directories per Program Files folder to avoid slowdown
- Mock data ensures functionality even without actual app installation
- AppSelector component handles network errors gracefully with fallback UI
