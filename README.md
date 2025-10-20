# Firebase Studio

This is a NextJS starter in Firebase Studio.

## IMPORTANT: Service Account Credentials

For security reasons, the Firebase service account key required for server-side operations (like some Genkit flows) has been removed from the repository.

To enable server-side functionality in your local development environment, you must manually add your credentials:

1.  **Generate a Service Account Key:**
    *   Go to your Firebase project settings > "Service accounts".
    *   Click "Generate new private key" and save the JSON file.

2.  **Populate the `service-account.json` file:**
    *   Open the downloaded JSON file.
    *   Copy the entire contents of the file.
    *   Paste the contents into `docs/service-account.json` in this project, completely replacing the placeholder content.

**This file is in your `.gitignore` and will not be committed to your repository.** This is for local development only. For a deployed environment, you would use a secure secret management system.

To get started, take a look at src/app/page.tsx.
# myportfolio
# myportfolio
