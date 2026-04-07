# Deployment Guide: Davao Explore ✈️

This document outlines the steps to successfully deploy **Davao Explore** to Vercel and synchronize it with your Supabase backend.

## 1. Environment Variables 🔑
In your Vercel Project Dashboard, navigate to **Settings > Environment Variables** and add:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL (from Settings > API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon/Public Key |

## 2. Supabase Auth Redirects 🛡️
Crucial for secure login! Supabase needs to know that your Vercel URL is "safe" for redirects.

1. Go to your **Supabase Dashboard > Authentication > URL Configuration**.
2. **Site URL**: Update this to your production Vercel URL (e.g., `https://davao-explore.vercel.app`).
3. **Redirect URLs**: Add your production URL + `/**` (e.g., `https://davao-explore.vercel.app/**`).

## 3. GitHub Push & Vercel Connect 🚀
1. Initialize Git (if not already done): `git init`
2. Add all files: `git add .`
3. Commit: `git commit -m "feat: rebranding, security headers, and build optimization"`
4. Push to your GitHub repository.
5. In Vercel, click **"New Project"**, import your repository, and click **Deploy**.

## 4. Post-Deployment Checks ✅
- [ ] Test the **PWA** installation on a mobile browser ("Add to Home Screen").
- [ ] Verify that **Admin** routes are protected (try visiting `/admin` while logged out).
- [ ] Check the **Explore Feed** for "Catigan" leftovers (there should be none!).
- [ ] Test **Offline Support** by turning off your internet and refreshing the page (top cafes should remain visible).

---
*Developed with ❤️ for the Davao Exploration Community.*
