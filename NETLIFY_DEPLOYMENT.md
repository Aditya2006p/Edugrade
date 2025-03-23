# Deploying EduGrade to Netlify

This document provides instructions for deploying the EduGrade application to Netlify.

## Prerequisites

1. A Netlify account (create one for free at [netlify.com](https://www.netlify.com/))
2. Git repository with your EduGrade code (GitHub, GitLab, or Bitbucket)

## Environment Variables

You'll need to set the following environment variables in your Netlify site dashboard:

- `GEMINI_API_KEY`: Your Google Generative AI API key
- `NODE_ENV`: Set to 'production'

## Deployment Steps

### Option 1: Automatic Deployment from Git

1. Log in to your Netlify account
2. Click "Add new site" > "Import an existing project"
3. Connect to your Git provider and select your EduGrade repository
4. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
5. Click "Show advanced" and add the required environment variables
6. Click "Deploy site"

### Option 2: Manual Deployment

1. Build your project locally:
```
npm run build
```

2. Install Netlify CLI:
```
npm install -g netlify-cli
```

3. Log in to Netlify CLI:
```
netlify login
```

4. Deploy manually:
```
netlify deploy --prod
```

5. Follow the prompts and specify the `build` directory when asked for the publish directory.

## Verifying the Deployment

1. After deployment, your site will be available at a Netlify URL (e.g., `your-site-name.netlify.app`)
2. Navigate to this URL to ensure your application is working correctly
3. Test the API endpoints by visiting `/.netlify/functions/api/health`

## Troubleshooting

- **API not working**: Check Netlify Functions logs in the Netlify dashboard
- **Missing environment variables**: Verify all required environment variables are set
- **Build failures**: Check the build logs for errors

## Custom Domain Setup

To use a custom domain:

1. Go to your site settings in Netlify
2. Navigate to "Domain management" > "Custom domains"
3. Click "Add custom domain"
4. Follow the instructions to set up DNS records for your domain 