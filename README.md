# Ad-Hoc Analytics

A modern, privacy-focused web analytics platform built with React and Supabase. Track visitor behavior, page views, outbound links, and file downloads in real-time with an intuitive dashboard interface.

## Features

- **Real-time Analytics**: Monitor active visitors and recent activity as it happens
- **Comprehensive Tracking**: Automatic tracking of page views, sessions, outbound links, and file downloads
- **Visitor Insights**: View detailed visitor timelines with page views and link clicks
- **Browser & Device Stats**: Track browser types, operating systems, and device information
- **Traffic Sources**: Understand where your visitors are coming from
- **~~Geographic Data~~**: [COMING SOON] See visitor locations and countries
- **Multi-Site Management**: Track multiple websites from a single dashboard
- **Privacy-Focused**: Session-based analytics. No cookies! No persistent tracking!

---

## For End Users

### How It Works

```
Website with tracking code
    ↓ (loads)
analytics.js from your-app-domain.com
    ↓ (sends tracking data)
Supabase Edge Function: your-supabase-anon-id.supabase.co/functions/v1/track
    ↓ (stores in)
Supabase Database
    ↓ (displays in)
Dashboard
```

### Getting Started

1.  **Sign Up / Sign In**

- Visit the analytics dashboard
- Create an account or sign in with your email and password

2.  **Add Your Website**

- Click the "Add Site" button
- Enter your website name and domain
- Click "Add Site" to create your tracking profile

3.  **Install Tracking Code**

- Click "Install Code" next to your site
- Copy the provided tracking code
- Paste it in the `<head>` section of your website, before the closing `</head>` tag
- The code will look like this:

```html
<!-- Analytics Tracking Code -->
<script>
  window.ANALYTICS_CONFIG = {
    trackingId: "your-tracking-id",
    apiUrl: "https://your-supabase-url.supabase.co/functions/v1/track",
  };
</script>
<script src="https://your-app-url.com/analytics.js" defer></script>
```

4.  **Start Tracking**

- Once installed, your dashboard will start displaying data immediately
- View real-time activity in the "Active Now" section
- Monitor page views, unique visitors, and engagement metrics

### Using the Dashboard

#### Overview Cards

- **Page Views**: Total number of pages viewed in the selected time range
- **Unique Visitors**: Click to see a detailed list of all visitors
- **Avg. Duration**: Average time visitors spend on your site
- **Active Now**: Click to see visitors currently active (last 5 minutes)

#### Real-time Activity

- Shows recent page views in the last 5 minutes
- Click any activity to see that visitor's complete timeline
- View their journey through your site with timestamps

#### Top Pages

- See which pages are most popular
- Track views and unique visitors per page

#### Top Links

- Monitor outbound link clicks and file downloads
- View click counts and unique visitors per link
- Filter by link type (outbound or file download)

#### Traffic Sources

- Understand where your visitors come from
- See referrer domains and direct traffic

#### Browser & Device Stats

- Track visitor browser types
- Monitor operating systems and device compatibility

#### Visitor Timeline

- Click "Unique Visitors" or any real-time activity to open detailed views
- See complete session timelines with page views and link clicks
- View time elapsed between actions
- Identify entry and exit pages

### Manual Tracking (Optional)

For JavaScript-triggered downloads or custom events that aren't automatically tracked:

```javascript
// Track a download triggered by JavaScript
window.analytics.trackDownload("https://example.com/file.pdf", "Report Name");

// Track an outbound link triggered by JavaScript
window.analytics.trackOutboundLink("https://example.com", "Link Text");
```

### Custom Event Tracking

Track custom user interactions and behaviors beyond page views and link clicks:

```javascript
// Track a button click
window.analytics.trackEvent("button_click", {
  button_name: "Sign Up",
  location: "hero_section",
});

// Track form submission
window.analytics.trackEvent("form_submit", {
  form_name: "contact_form",
  fields_completed: 5,
});

// Track video interaction
window.analytics.trackEvent("video_play", {
  video_title: "Product Demo",
  duration: "2:30",
  position: 0,
});

// Track e-commerce actions
window.analytics.trackEvent("add_to_cart", {
  product_id: "ABC123",
  product_name: "Premium Widget",
  price: 29.99,
  quantity: 1,
});

// Track search queries
window.analytics.trackEvent("search", {
  query: "analytics dashboard",
  results_count: 42,
});

// Track feature usage
window.analytics.trackEvent("feature_used", {
  feature_name: "export_data",
  export_format: "csv",
});
```

**Event Data Structure:**

- `event_name` (string): Descriptive name for the event (use lowercase with underscores)
- `event_data` (object): Any additional data you want to track (stored as JSON)

**Best Practices:**

- Use consistent naming conventions (e.g., `button_click`, `form_submit`)
- Keep event names descriptive and specific
- Include relevant context in event_data
- Avoid tracking sensitive or personally identifiable information
- Events are stored in the `events` table with session information for analysis

### Time Range Selection

Use the dropdown in the top-right to change the analytics time range:

- Last 24 Hours (default)
- Last 7 Days
- Last 30 Days

---

## For Developers

### Tech Stack

**Frontend:**

- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)

**Backend:**

- Supabase (PostgreSQL database)
- Supabase Edge Functions (serverless API)
- Supabase Authentication (email/password)

**Analytics Tracking:**

- Vanilla JavaScript tracking script (`public/analytics.js`)
- Automatic detection of page views, links, and downloads
- Session-based tracking with no cookies

### Project Structure

```
project/
├── src/
│ ├── components/ # React components
│ │ ├── AddSiteModal.tsx # Modal for adding new sites
│ │ ├── Analytics.tsx # Main analytics dashboard
│ │ ├── Auth.tsx # Authentication UI
│ │ ├── BrowserStats.tsx # Browser usage charts
│ │ ├── Dashboard.tsx # Main dashboard layout
│ │ ├── InstallCode.tsx # Install code modal
│ │ ├── PageViewDrawer.tsx # Visitor timeline drawer
│ │ ├── RealtimeVisitors.tsx # Real-time activity list
│ │ ├── SiteList.tsx # Site selection sidebar
│ │ ├── StatCard.tsx # Metric cards
│ │ ├── TopLinks.tsx # Top links/downloads table
│ │ ├── TopPages.tsx # Top pages table
│ │ ├── TrafficSources.tsx # Referrer sources
│ │ └── VisitorList.tsx # Visitor list modal
│ ├── contexts/
│ │ └── AuthContext.tsx # Authentication context
│ ├── lib/
│ │ └── supabase.ts # Supabase client setup
│ ├── App.tsx # Root component
│ ├── main.tsx # App entry point
│ └── index.css # Global styles
├── public/
│ ├── analytics.js # Tracking script (deployed with app)
│ ├── test-tracking.html # Test page for tracking
│ └── _redirects # Netlify redirects config
├── supabase/
│ ├── functions/
│ │ └── track/ # Edge function for tracking
│ │ └── index.ts
│ └── migrations/ # Database migrations
│ ├── 20251107195639_create_analytics_schema.sql
│ ├── 20251107200953_fix_security_and_performance_issues.sql
│ └── 20251108002542_add_link_clicks_tracking.sql
└── package.json
```

### Database Schema

**Tables:**

- `sites`: Website configurations
- `sessions`: Visitor sessions with metadata
- `page_views`: Individual page view records
- `link_clicks`: Outbound links and file downloads

**Row Level Security (RLS):**

- All tables have RLS enabled
- Users can only access their own sites and data
- Edge function uses service role for authenticated writes

### Installation & Setup

#### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Git

#### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd project
npm install
```

#### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase project settings (Settings > API).

#### 3. Database Setup

The database migrations are located in `supabase/migrations/`. These should be automatically applied if you're using the Supabase MCP integration, or you can apply them manually via the Supabase dashboard:

1. Go to the SQL Editor in your Supabase dashboard
2. Run each migration file in order (by filename timestamp)

Key migrations include:

- Schema creation (sites, sessions, page_views, link_clicks)
- RLS policies for security
- Indexes for performance
- Link tracking functionality

#### 4. Deploy Edge Function

The tracking endpoint is a Supabase Edge Function. It should be deployed using the Supabase MCP tools, or manually:

```bash
# Using Supabase CLI (if available)
supabase functions deploy track
```

The edge function is located at `supabase/functions/track/index.ts`.

#### 5. Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

#### 6. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

**Important:** Make sure the `public/analytics.js` file is accessible at your deployed URL (e.g., `https://yourdomain.com/analytics.js`). This script needs to be referenced in the tracking code you give to users.

### Development Scripts

```bash
npm run dev  # Start development server
npm run build  # Build for production
npm run preview  # Preview production build
npm run lint  # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

### Key Implementation Details

#### Analytics Tracking Script

The `public/analytics.js` file is a self-contained tracking script that:

- Generates unique session IDs stored in sessionStorage
- Tracks page views automatically on load and URL changes
- Detects and tracks outbound links and file downloads
- Sends data to the Supabase Edge Function via `sendBeacon` API
- Works without cookies for privacy compliance

#### Authentication Flow

- Uses Supabase Auth with email/password
- Auth state managed via React Context (`AuthContext.tsx`)
- Protected routes require authentication
- Automatic session persistence

#### Real-time Updates

- Dashboard polls for new data every 30 seconds
- Real-time activity refreshes every 5 seconds
- Active visitors determined by last_seen within 5 minutes

#### File Download Detection

The tracking script detects file downloads by:

1. File extensions (PDF, DOC, ZIP, etc.)
2. URL query parameters containing "download" or "attachment"
3. HTML5 `download` attribute on links
4. Manual API calls via `window.analytics.trackDownload()`

### Troubleshooting

**Tracking Not Working:**

1. Verify the tracking script URL is correct and accessible
2. Check browser console for errors
3. Ensure the Edge Function is deployed and the API URL is correct
4. Verify CORS headers are set correctly in the Edge Function

**No Data Showing:**

1. Check that the tracking ID matches between script and dashboard
2. Verify RLS policies allow reading data
3. Ensure sessions and page_views are being created in the database

**Build Errors:**

1. Run `npm run typecheck` to check for TypeScript errors
2. Ensure all dependencies are installed (`npm install`)
3. Check that environment variables are set correctly

### Contributing

When adding new features:

1. Follow the existing component structure
2. Use TypeScript for type safety
3. Update RLS policies if adding new tables
4. Test tracking script changes thoroughly
5. Document any new manual tracking APIs

### Security Notes

- Never expose the Supabase service role key in client-side code
- All client-side requests use the anon key
- RLS policies enforce user data isolation
- Edge Function uses service role for write operations
- No sensitive user data is tracked (respects privacy)

## Author

Micah Murray [@micah1701](https://github.com/micah1701)

Proudly vibe coded in a single weekend using [Bolt](https://bolt.new/?rid=w4jgxz).
