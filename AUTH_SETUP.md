# Authentication Setup Guide

This document explains how to set up and use the authentication system in your AI Tutor application.

## Overview

The authentication system uses:

- **NextAuth.js** for authentication management
- **Prisma** with **MongoDB** for user data storage
- **bcryptjs** for password hashing
- **shadcn/ui** components for the UI
- **zod** for form validation

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/study-fetch-task?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-please-change-this"
```

**Important:**

- Replace `DATABASE_URL` with your actual MongoDB Atlas connection string
- Generate a secure `NEXTAUTH_SECRET` using: `openssl rand -base64 32`

### 2. Database Setup

Push your Prisma schema to MongoDB:

```bash
npx prisma db push
```

### 3. Start the Development Server

```bash
npm run dev
```

## File Structure

```
src/
├── app/
│   ├── api/auth/
│   │   ├── [...nextauth]/route.ts    # NextAuth API routes
│   │   └── signup/route.ts           # User registration endpoint
│   ├── auth/
│   │   ├── signin/page.tsx           # Sign in page
│   │   └── signup/page.tsx           # Sign up page
│   ├── dashboard/page.tsx            # Protected dashboard
│   ├── layout.tsx                    # Root layout with session provider
│   └── page.tsx                      # Landing page
├── components/
│   ├── auth/
│   │   ├── signin-form.tsx           # Sign in form component
│   │   ├── signup-form.tsx           # Sign up form component
│   │   └── signout-button.tsx        # Sign out button
│   ├── providers/
│   │   └── session-provider.tsx      # NextAuth session provider
│   └── ui/                           # shadcn/ui components
├── lib/
│   ├── auth.ts                       # NextAuth configuration
│   ├── prisma.ts                     # Prisma client setup
│   └── utils.ts                      # Utility functions
├── types/
│   └── next-auth.d.ts               # NextAuth TypeScript types
└── middleware.ts                     # Route protection middleware
```

## How It Works

### Authentication Flow

1. **Sign Up:** Users create an account with name, email, and password
2. **Password Hashing:** Passwords are hashed using bcryptjs before storage
3. **Sign In:** Users authenticate with email and password
4. **Session Management:** JWT tokens manage user sessions
5. **Route Protection:** Middleware protects authenticated routes

### Database Schema

The system includes models for:

- **User:** Basic user information and authentication
- **Account/Session:** NextAuth.js session management
- **PDF/Chat/Message:** Future features for the AI tutor functionality

### Protected Routes

Routes under `/dashboard/*` are automatically protected by middleware. Unauthenticated users are redirected to the sign-in page.

## Usage

### For Users

1. Visit the home page
2. Click "Get Started" or "Sign In"
3. Create an account or sign in with existing credentials
4. Access the dashboard to start using the AI tutor

### For Developers

#### Accessing User Session

In Server Components:

```tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Handle unauthenticated state
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {session.user?.name}</div>;
}
```

In Client Components:

```tsx
import { useSession } from "next-auth/react";

export default function Component() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  if (status === "unauthenticated") return <p>Not signed in</p>;

  return <p>Signed in as {session?.user?.name}</p>;
}
```

#### Adding New Protected Routes

Add route patterns to `middleware.ts`:

```ts
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/protected/:path*",
    "/your-new-route/:path*", // Add new protected routes here
  ],
};
```

## Security Features

- **Password Hashing:** bcryptjs with salt rounds for secure password storage
- **JWT Tokens:** Secure session management without server-side session storage
- **Route Protection:** Automatic authentication checks for protected routes
- **Form Validation:** Client and server-side validation using zod
- **CSRF Protection:** Built-in CSRF protection via NextAuth.js

## Next Steps

The authentication system is now ready! You can proceed with implementing:

1. **PDF Upload functionality**
2. **AI Chat integration**
3. **Document viewing with annotations**
4. **Chat history persistence**

All user data will be automatically associated with the authenticated user through the session system.
