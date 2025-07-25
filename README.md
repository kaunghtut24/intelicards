# CogniCard: AI Contact Manager

An AI-powered contact management application that uses Gemini to scan business cards and organize contacts. All data is stored locally in your browser for privacy.

## Features

- AI-powered business card scanning
- Contact intelligence with web search
- Local storage for privacy
- Export to vCard and CSV
- Batch import capabilities
- Responsive design

## Local Development

**Prerequisites:** Node.js

1. Clone the repository:
   ```bash
   git clone https://github.com/kaunghtut24/intelicards.git
   cd intelicards
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your Gemini API key.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Vercel

1. Push to GitHub
2. Connect your repository to Vercel
3. Add `GEMINI_API_KEY` environment variable in Vercel dashboard
4. Deploy

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key

## License

MIT
