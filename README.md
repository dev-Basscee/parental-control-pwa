# Parental Control PWA

A modern, Progressive Web Application (PWA) for managing parental controls and blocking apps with real-time countdown timers. Built with React, Vite, TypeScript, and Tailwind CSS.

## Features

- **PIN-Protected Access**: Secure authentication with PIN code that survives browser sessions
- **Real-Time App Blocking**: Block apps with live countdown timers showing remaining block time
- **Multiple Duration Options**: Choose from preset durations (15 min, 30 min, 1 hour, 2 hours) or set custom durations
- **Activity Log**: View all block/unblock events with timestamps
- **Connection Status**: Visual indicator for backend connectivity
- **Progressive Web App**: Install as standalone app on mobile or desktop
- **Service Worker**: Offline support with intelligent caching strategy
- **Responsive Design**: Optimized for mobile, tablet, and desktop screens
- **Rate Limiting**: 3-strike lockout after failed PIN attempts with 5-minute cooldown

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8.1
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **HTTP Method**: RESTful API (with mock implementation)

## Project Structure

```
src/
├── components/
│   ├── PinGate.tsx           # PIN authentication component
│   ├── Dashboard.tsx          # Main dashboard with tabs
│   ├── Blocklist.tsx          # Blocked apps list
│   ├── BlockListItem.tsx      # Individual blocked app item
│   ├── AddBlockModal.tsx      # Modal to add new blocked app
│   ├── ActivityLog.tsx        # Activity log viewer
│   ├── ConnectionStatus.tsx   # Backend connection indicator
│   └── LogoutButton.tsx       # Logout button
├── hooks/
│   └── usePWA.ts            # PWA integration hook
├── lib/
│   ├── api.ts               # API client with mock implementation
│   ├── utils.ts             # Utility functions
│   └── dateUtils.ts         # Date formatting utilities
├── App.tsx                  # Main application component
├── main.tsx                 # Entry point with PWA registration
└── index.css                # Global styles with Tailwind

public/
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker
├── icon-192x192.png         # App icon 192x192
├── icon-512x512.png         # App icon 512x512
├── icon-192x192-maskable.png  # Maskable icon 192x192
└── icon-512x512-maskable.png  # Maskable icon 512x512

vite.config.ts              # Vite configuration
tsconfig.json               # TypeScript configuration
index.html                  # HTML entry point
```

## Getting Started

### Prerequisites

- Node.js 16+ 
- pnpm (or npm/yarn)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
pnpm build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
pnpm preview
```

## Usage Guide

### Setting PIN (First Login)

1. Open the app and you'll see the PIN Gate screen
2. Enter a 4-6 digit PIN code
3. Click "Unlock" - this PIN is now stored for future sessions
4. You'll be authenticated and redirected to the Dashboard

### Blocking Apps

1. Click "Block New App" button on the Dashboard
2. Enter the app name (e.g., "TikTok", "Instagram")
3. Select a duration:
   - Quick presets: 15 min, 30 min, 1 hour, 2 hours
   - Or enter a custom duration in minutes
4. Click "Block App"
5. The app appears in "Currently Blocked" section with live countdown

### Managing Blocked Apps

- **Remove Block**: Click the ✕ button on any blocked app card
- **View Status**: Countdown timer updates every second
- **Switch Tabs**: Toggle between "Blocked Apps" and "Activity Log"

### Activity Log

View all blocking events with timestamps:
- **Blocked**: App was added to blocklist
- **Unblocked**: App was removed from blocklist  
- **Login**: User authenticated with PIN
- **Logout**: User logged out

### Logout

Click the logout button (↗) in the top-right corner to return to PIN Gate.

## API Implementation

The app uses a mock API layer (`src/lib/api.ts`) with the following endpoints:

### Authentication
- `verifyPin(pin: string)` - Verify PIN and get session token

### Blocklist Management
- `getBlocklist()` - Get all blocked apps
- `addToBlocklist(appName, durationMinutes)` - Block an app
- `removeFromBlocklist(appId)` - Unblock an app

### Activity
- `getActivityLog()` - Get all activity events
- `healthCheck()` - Check backend connectivity

### Features
- **3-Strike Lockout**: After 3 failed PIN attempts, lockout for 5 minutes
- **Rate Limiting**: Simple client-side rate limiting
- **Error Handling**: User-friendly error messages
- **Data Persistence**: localStorage for session tokens and PIN hash

## PWA Features

### Installation

The app can be installed on mobile and desktop:

**Mobile**:
- Open in Chrome/Edge, tap menu → "Install app"
- Or use "Add to Home Screen" on iOS Safari

**Desktop**:
- Open in Chrome/Edge, click install icon in address bar

### Offline Support

The service worker caches:
- HTML shell and static assets (app shell cache-first)
- API responses (network-first, falls back to cache)

When offline:
- The app shell loads from cache
- Previously loaded data remains available
- Connection status banner appears

### Manifest

The PWA manifest includes:
- App name, short name, and description
- Icon sets (192x192, 512x512, maskable variants)
- Display mode (standalone)
- Theme color and background color
- Supported categories

## Styling & Design

### Color Palette

- **Primary**: Blue (#2563eb)
- **Destructive**: Red (#ef4444)
- **Background**: White
- **Foreground**: Dark Gray (#1a1a1a)
- **Muted**: Gray (#808080)
- **Border**: Light Gray (#e5e5e5)

### Design Principles

- Mobile-first responsive design
- Accessible color contrasts
- Clean, minimal UI
- Smooth animations and transitions
- Semantic HTML elements

## Browser Support

- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Development

### Running Tests

```bash
# To be implemented
pnpm test
```

### Building & Deployment

1. Build for production: `pnpm build`
2. Deploy `dist/` folder to your hosting:
   - Vercel (recommended)
   - Netlify
   - GitHub Pages
   - Any static hosting

### Environment Variables

Currently no required environment variables. The app uses a mock API implementation.

To connect to a real backend, update `src/lib/api.ts`:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
```

## Performance

- **LCP**: < 2.5s (optimized with Vite)
- **FCP**: < 1.5s
- **CLS**: < 0.1
- **PWA Score**: 90+

## Security Considerations

- PIN is hashed with simple algorithm (client-side only - replace with proper hashing for production)
- Session tokens stored in localStorage
- CORS headers needed for backend API
- Implement HTTPS in production
- Add server-side PIN verification
- Use secure session management on backend

## Future Enhancements

- [ ] Backend integration with database
- [ ] Multi-device synchronization  
- [ ] Advanced filtering and categories
- [ ] Weekly/monthly block schedules
- [ ] Unlock request notifications
- [ ] Parental override PIN
- [ ] App usage statistics
- [ ] Dark mode
- [ ] Multiple user accounts
- [ ] Push notifications

## Troubleshooting

### PIN keeps being forgotten
- Check browser localStorage in DevTools
- Clear cache and cookies, then re-enter PIN

### Service Worker not updating
- Use Incognito/Private mode for fresh install
- Or manually update via browser dev tools

### App not installing on iOS
- Ensure using iOS Safari 14+
- Add to Home Screen from share menu
- Must be served over HTTPS (except localhost)

### API errors
- Check backend connectivity via Connection Status banner
- Verify CORS headers are correct
- Check browser console for detailed errors

## License

MIT

## Support

For issues and feature requests, please open an issue on GitHub.
