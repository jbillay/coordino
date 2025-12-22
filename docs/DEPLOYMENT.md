# Deployment Setup Guide

This guide explains how to set up automated deployment to Vercel through GitHub Actions.

## Overview

The CI/CD pipeline automatically deploys to Vercel production when:
- Code is pushed to the `main` branch
- All quality gates pass (lint, tests, build)

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. VERCEL_TOKEN

Your Vercel authentication token.

**How to get it:**
1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "GitHub Actions")
4. Select the scope (recommended: Full Account)
5. Copy the generated token

### 2. VERCEL_ORG_ID

Your Vercel organization/team ID.

**How to get it:**
1. Go to your Vercel dashboard
2. Click on your team/account name in the top left
3. Go to "Settings" → "General"
4. Copy the "Team ID" or "Personal Account ID"

**Alternative method (using Vercel CLI):**
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link your project
vercel link

# Check the .vercel/project.json file
cat .vercel/project.json
```

### 3. VERCEL_PROJECT_ID

Your Vercel project ID.

**How to get it:**
1. Go to your project in Vercel dashboard
2. Go to "Settings" → "General"
3. Copy the "Project ID"

**Alternative method (using Vercel CLI):**
```bash
# After running 'vercel link', check:
cat .vercel/project.json
```

## Adding Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret:
   - Name: `VERCEL_TOKEN`
   - Value: [your Vercel token]
   - Click "Add secret"
5. Repeat for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`

## Environment Configuration

The workflow is configured to deploy to the **production** environment:
- **Environment Name:** production
- **URL:** https://coordino.app

### GitHub Environment Setup (Optional but Recommended)

For additional protection, you can configure the production environment:

1. Go to **Settings** → **Environments**
2. Click **"New environment"**
3. Name it `production`
4. Configure protection rules:
   - ✅ Required reviewers (optional)
   - ✅ Wait timer (optional)
   - ✅ Deployment branches: Only `main` branch
5. Add environment secrets if needed

## Deployment Workflow

Here's what happens when you push to `main`:

```
Push to main
    ↓
Install Dependencies
    ↓
┌─────────┬─────────────┬──────────┐
│  Lint   │ Unit Tests  │  Build   │
└─────────┴─────────────┴──────────┘
    ↓
Quality Gate Check
    ↓
✅ All Passed?
    ↓
Deploy to Vercel (Production)
    ↓
🎉 Live at https://coordino.app
```

## Verifying Deployment

After a successful deployment, you can verify:

1. **GitHub Actions:**
   - Go to the **Actions** tab in your repository
   - Check the latest workflow run
   - The "Deploy to Vercel" job should show ✅

2. **Vercel Dashboard:**
   - Go to your [Vercel dashboard](https://vercel.com/dashboard)
   - Click on your project
   - Check the latest deployment
   - You should see a deployment from "GitHub Actions"

3. **Live Site:**
   - Visit https://coordino.app
   - Verify your latest changes are live

## Troubleshooting

### "Invalid token" error
- Ensure your `VERCEL_TOKEN` is correct and hasn't expired
- Regenerate a new token if needed

### "Project not found" error
- Verify `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` are correct
- Check that the project exists in your Vercel account

### "Permission denied" error
- Ensure your Vercel token has the correct scope
- The token needs permission to deploy to the organization/team

### Deployment doesn't trigger
- Ensure you're pushing to the `main` branch
- Check that all quality gates passed
- Verify the workflow file has no syntax errors

## Manual Deployment

If you need to deploy manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

## Rollback

If you need to rollback a deployment:

1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to the "Deployments" tab
4. Find a previous successful deployment
5. Click the "⋮" menu → "Promote to Production"

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions with Vercel](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
