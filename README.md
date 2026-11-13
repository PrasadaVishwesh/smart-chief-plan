# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/736be95f-5483-4306-803e-4ba9d69ac7d3

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/736be95f-5483-4306-803e-4ba9d69ac7d3) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/736be95f-5483-4306-803e-4ba9d69ac7d3) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## SEO build output

`npm run build` prerenders `/`, `/recipes/`, `/meal-planner/`, `/about/`, `/faq/`, every recipe at `/recipes/<slug>/`, private noindex shells, and `404.html`. It writes JSON-LD, `dist/sitemap.xml` with source-derived `lastmod` values, and `dist/robots.txt`. Canonical URLs default to `https://smart-chief-prasadavishwesh.vercel.app`; set `VITE_SITE_URL` to override the canonical origin. It must be a plain HTTP(S) origin.

The recipe collection and public page content are static. Authenticated favorites and meal plans use Supabase; visitors without a session can use the meal planner and shopping list with data stored only in their current browser. A Supabase migration adds atomic per-user limits (10 requests/minute for the cooking assistant and recommendations, 3/minute for image generation, and 120 writes/minute across favorites and meal plans). Apply pending migrations before deploying the updated Edge Functions; they fail closed if the rate-limit RPC or service-role key is unavailable. Browser analytics events are emitted as `smartchief:analytics` CustomEvents without sending data to a third party. Connect a privacy-compliant analytics provider separately if persistent reporting is needed.
