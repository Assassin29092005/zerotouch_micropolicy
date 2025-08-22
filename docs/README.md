# ZeroTouch MicroPolicy

A revolutionary insurance platform that processes claims in seconds using AI-powered automation and blockchain verification.

## Features

- **Instant Claims Processing**: AI monitors global data sources and processes claims in under 30 seconds
- **Micro-Policies**: Pay only for what you need, when you need it
- **Blockchain Verification**: Transparent, immutable claim records
- **Zero-Touch Experience**: Fully automated from detection to payout
- **Global Coverage**: Works anywhere in the world with 24/7 monitoring
- **PWA Support**: Installable app with offline capabilities
- **Admin Dashboard**: Comprehensive policy and user management, including adding, editing, and deleting policies, and triggering manual claims.
- **User Dashboard**: Overview of user's policies and claims.
- **Onboarding Experience**: Interactive video to explain policy benefits.
- **Secure Authentication**: User and Admin sign-up/login with email verification.
- **Custom Pop-ups**: Enhanced user feedback with custom success, error, and confirmation modals.
- **Password Visibility Toggle**: "Eye" button for password fields.

## Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time, Edge Functions)
- **Styling**: Custom CSS with modern design system
- **PWA**: Service Worker for offline functionality
- **Charts**: HTML5 Canvas for admin analytics

## Getting Started

### Prerequisites

- Modern web browser
- Supabase account
- Node.js and npm (or npx) for local server and CLI tools
- Supabase CLI installed (run `npm install -g supabase` or use `npx supabase` directly)

### Installation

1.  **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/yourusername/zerotouch-micropolicy.git
    cd zerotouch-micropolicy
    \`\`\`

2.  **Set up Supabase Project:**
    * Follow the detailed instructions in `docs/SUPABASE_SETUP.md` to create your Supabase project, database tables, RLS policies, and database functions.
    * **Crucially, set up your Edge Functions (`backend/supabase/functions/admin/index.js`) and configure their environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, ADMIN_SECRET_KEY) in your Supabase dashboard or via the CLI.**

3.  **Configure Frontend:**
    * Open `frontend/js/config.js`.
    * Replace `"YOUR_SUPABASE_URL"` with your actual Supabase Project URL.
    * Replace `"YOUR_SUPABASE_ANON_KEY"` with your actual Supabase Public Anon Key.

4.  **Configure Local Environment Variables (.env):**
    * Create a file named `.env` in the **root** of your `zerotouch-micropolicy` project folder.
    * Add your `ADMIN_SECRET_KEY` here (a strong, unique string you choose).
    * **Example `.env`:**
        \`\`\`
        ADMIN_SECRET_KEY="your_chosen_secure_admin_secret_string"
        \`\`\`
    * **Remember to add `.env` to your `.gitignore`!**

5.  **Set Supabase Secrets via CLI:**
    * From your project's root directory (`zerotouch-micropolicy/`), log in to the Supabase CLI:
        \`\`\`bash
        npx supabase login
        \`\`\`
    * Then, set your `ADMIN_SECRET_KEY` as a secret for your Supabase project (this makes it available to your deployed Edge Functions):
        \`\`\`bash
        npx supabase secrets set --env-file .env
        \`\`\`
        *(Note: `SUPABASE_SERVICE_ROLE_KEY` is automatically provided to Edge Functions and does not need to be set manually via `supabase secrets set`.)*

6.  **Serve the application locally:**
    * From your project's root directory (`zerotouch-micropolicy/`), run:
        \`\`\`bash
        npx serve frontend/
        \`\`\`
        *(This serves the `frontend` folder, which contains your `index.html` and other assets.)*

7.  **Open in browser:**
    * Navigate to `http://localhost:3000` (or the address provided by `npx serve`) in your web browser.

## Deployment on Render

This project is a static site application, which is straightforward to deploy on Render.

1.  **Create a new Web Service on Render:**
    * Go to [https://render.com/](https://render.com/) and log in.
    * Click "New" -> "Static Site".
2.  **Connect your Git Repository:**
    * Connect your GitHub/GitLab repository where your `zerotouch-micropolicy` project is hosted.
3.  **Configure Build & Deploy Settings:**
    * **Root Directory:** Set this to `frontend/` (since all your deployable assets are inside this folder).
    * **Build Command:** Leave empty (as it's a static site with no build step).
    * **Publish Directory:** Leave empty (Render will serve the root directory).
    * **Environment Variables:** Add your Supabase environment variables here:
        * `SUPABASE_URL`
        * `SUPABASE_ANON_KEY`
        * `SUPABASE_SERVICE_ROLE_KEY` (Your secret service role key)
        * `ADMIN_SECRET_KEY` (Your secret admin key)
4.  **Deploy:** Click "Create Web Service". Render will automatically deploy your site.

## License

MIT License - see LICENSE file for details

## Support

For support, email support@zerotouch.com or create an issue on GitHub.

## Roadmap

- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] More policy types
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Cryptocurrency payments
- [ ] Machine learning improvements