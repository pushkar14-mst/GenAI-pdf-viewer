# AI PDF Tutor

An AI-powered PDF viewer and tutor that helps students understand documents through interactive chat and intelligent highlighting.

## What it does

This application allows users to:

- Upload PDF documents
- Chat with an AI tutor about the content
- Get AI-generated highlights and annotations on the PDF
- Navigate between pages with AI guidance
- View chat history and continue conversations

The AI can reference specific parts of the PDF, highlight important text, and navigate to relevant pages while explaining concepts.

## Tech Stack

- Next.js 15 (App Router)
- Prisma ORM with MongoDB
- NextAuth.js for authentication
- Google Gemini AI for chat functionality
- React PDF for document viewing
- Tailwind CSS with shadcn/ui components

## Prerequisites

- Node.js 18+
- MongoDB database (local or Atlas)
- Google Gemini API key

## Setup

1. Clone the repository

```bash
git clone <your-repo-url>
cd study-fetch-task
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables
   Create a `.env` file in the root directory:

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/study-fetch-task"
GEMINI_API_KEY="your-gemini-api-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

4. Set up the database

```bash
npx prisma generate
npx prisma db push
```

5. Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. Sign up for an account or sign in
2. Upload a PDF document from your dashboard
3. Click on the PDF to open the viewer
4. Start chatting with the AI about the document content
5. The AI will highlight relevant text and navigate to important sections

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

- `src/app/` - Next.js app router pages and API routes
- `src/components/` - Reusable UI components
- `src/lib/` - Utility functions and configurations
- `prisma/` - Database schema and migrations

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/upload-pdf` - PDF upload and management
- `/api/chat` - AI chat functionality
- `/api/pdf/*` - PDF serving and metadata

## Notes

- PDF text extraction is handled client-side to avoid server-side PDF.js issues
- The build process includes Prisma client generation for Vercel deployment
- ESLint and TypeScript errors are ignored during build for deployment flexibility
