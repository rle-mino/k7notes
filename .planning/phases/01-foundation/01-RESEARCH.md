# Phase 1: Foundation - Research

**Researched:** 2026-01-31
**Domain:** Cross-platform mobile/web authentication, monorepo architecture, local-first data
**Confidence:** MEDIUM

## Summary

Phase 1 establishes a cross-platform foundation using React Native/Expo for mobile (iOS/Android) and web, NestJS for backend API, and better-auth for authentication. The project uses Turborepo monorepo with pnpm, PostgreSQL with Drizzle ORM on the server, and will extend to SQLite for local-first mobile storage in later phases.

The 2026 landscape has matured significantly: Expo SDK 52+ auto-detects monorepos (eliminating Metro configuration hell), better-auth provides TypeScript-first authentication with official Expo integration, and Drizzle ORM offers modern type-safe database access. The stack is proven compatible - better-auth works with both NestJS (via community package) and Expo (via official plugin).

Key architectural insight: This phase lays authentication and platform infrastructure but defers local-first sync complexity. Users authenticate against the NestJS backend using better-auth, with sessions persisted in Expo SecureStore. The shared schema between SQLite and PostgreSQL will be implemented in Phase 2 (Core Features) when local-first note storage is built.

**Primary recommendation:** Use Expo (not bare React Native CLI) for automatic monorepo support, better-auth for authentication across all platforms, and Turborepo with pnpm for workspace management. Start with PostgreSQL on NestJS backend only; add SQLite + sync in Phase 2.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Expo | SDK 52+ | Cross-platform framework (iOS/Android/web) | Auto-detects monorepos, official tooling, largest ecosystem |
| better-auth | 1.4.15+ | TypeScript-native authentication | Framework-agnostic, Expo + NestJS support, OAuth + email/password |
| Turborepo | Latest | Monorepo task orchestration | Industry standard, caching, works with React Native |
| pnpm | Latest | Package manager with workspaces | First-class Expo support (SDK 52+), isolated dependencies |
| NestJS | Latest | Backend API framework | TypeScript-first, modular architecture, 2026 gold standard |
| Drizzle ORM | Latest | Type-safe database ORM | Modern PostgreSQL standards, better-auth adapter, migrations |
| PostgreSQL | 15+ | Production database | Reliable, Drizzle support, better-auth tested |
| expo-secure-store | Latest | Encrypted session storage | Native keychain/keystore access, better-auth Expo plugin uses this |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @better-auth/expo | Latest | better-auth Expo client plugin | Required for React Native authentication |
| @thallesp/nestjs-better-auth | 1.3.8+ | NestJS integration for better-auth | Backend route protection, decorators |
| @react-native-google-signin/google-signin | Latest | Google OAuth for React Native | Google sign-in (requires dev build, not Expo Go) |
| expo-auth-session | Latest | OAuth flow helper | Alternative/supplementary OAuth handling |
| @expo/metro-config | Latest | Metro bundler config | Auto-configured in SDK 52+ monorepos |
| drizzle-kit | Latest | Migration generation/application | Schema changes, database setup |
| node-postgres (pg) | Latest | PostgreSQL driver for Drizzle | Standard connection library |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Expo | Bare React Native CLI | Bare RN requires manual Metro config in monorepo, no automatic detection, harder setup |
| better-auth | Passport.js + custom | Passport.js lacks modern TypeScript, no official Expo integration, more boilerplate |
| better-auth | Clerk/Auth0/Supabase | Vendor lock-in, costs scale with users, less control over auth flow |
| Turborepo | Nx | Nx has steeper learning curve, Turborepo simpler for this stack |
| pnpm | npm/yarn | npm slower, yarn v1 outdated; pnpm has best Expo SDK 52+ support |
| Drizzle | Prisma | Prisma heavier, Drizzle more aligned with better-auth examples |

**Installation:**

```bash
# Root workspace
pnpm add -Dw turbo

# Backend (NestJS)
pnpm add better-auth drizzle-orm pg @thallesp/nestjs-better-auth
pnpm add -D drizzle-kit @types/pg

# Mobile app (Expo)
npx expo install better-auth @better-auth/expo expo-secure-store expo-network
npx expo install @react-native-google-signin/google-signin expo-linking expo-web-browser expo-constants

# Shared packages
pnpm add -D typescript @types/node
```

## Architecture Patterns

### Recommended Project Structure

```
k7notes/
├── apps/
│   ├── mobile/              # Expo app (iOS, Android, web)
│   │   ├── app/             # Expo Router file-based routing
│   │   ├── src/
│   │   │   ├── components/  # React Native components
│   │   │   └── lib/         # Auth client setup
│   │   ├── app.json         # Expo config (scheme, bundle ID)
│   │   └── package.json
│   └── api/                 # NestJS backend
│       ├── src/
│       │   ├── auth/        # Better-auth setup module
│       │   ├── users/       # User-related endpoints
│       │   └── main.ts      # bodyParser: false for better-auth
│       ├── drizzle.config.ts
│       └── package.json
├── packages/
│   ├── typescript-config/   # Shared tsconfig.json base
│   ├── eslint-config/       # Shared linting rules
│   └── types/               # Shared TypeScript types (later phases)
├── turbo.json               # Task pipeline configuration
├── pnpm-workspace.yaml      # Workspace definition
└── package.json             # Root package.json (devDependencies only)
```

### Pattern 1: better-auth Server Setup (NestJS)

**What:** Configure better-auth instance with Drizzle adapter and Google OAuth, disable NestJS body parser, register AuthModule globally.

**When to use:** Backend initialization - this is the foundation for all authentication.

**Example:**

```typescript
// apps/api/src/auth/auth.config.ts
// Source: https://www.better-auth.com/docs/adapters/drizzle
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: process.env.BASE_URL, // Critical for OAuth redirect_uri
  trustedOrigins: [
    "myapp://", // Deep link scheme from app.json
    "exp://", // Expo dev scheme
    "http://localhost:3000",
  ],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessType: "offline", // Get refresh tokens
      prompt: "select_account", // Always show account picker
    },
  },
  plugins: [expo()],
});

// apps/api/src/main.ts
// Source: https://www.better-auth.com/docs/integrations/nestjs
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // CRITICAL: better-auth handles raw bodies
  });
  await app.listen(3000);
}

// apps/api/src/app.module.ts
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth/auth.config';

@Module({
  imports: [
    AuthModule.forRoot({ auth }),
    // ... other modules
  ],
})
export class AppModule {}
```

### Pattern 2: better-auth Client Setup (Expo)

**What:** Create auth client with expoClient plugin, configure SecureStore for session persistence, use scheme from app.json.

**When to use:** Mobile app initialization - enables authentication from React Native.

**Example:**

```typescript
// apps/mobile/src/lib/auth.ts
// Source: https://www.better-auth.com/docs/integrations/expo
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL, // e.g., http://localhost:3000
  plugins: [
    expoClient({
      scheme: "myapp", // Must match app.json scheme
      storagePrefix: "k7notes",
      storage: SecureStore,
    }),
  ],
});

// apps/mobile/app/_layout.tsx
import { useSession } from "./src/lib/auth";

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <LoadingScreen />;

  return session ? <AppTabs /> : <AuthFlow />;
}
```

### Pattern 3: Google OAuth Flow (Expo)

**What:** Configure Google OAuth with three client IDs (web, iOS, Android), use web client ID in code, enable deep linking for redirect.

**When to use:** Setting up Google sign-in - both platforms require specific setup.

**Example:**

```typescript
// apps/mobile/src/screens/LoginScreen.tsx
// Source: https://www.better-auth.com/docs/authentication/google
import { authClient } from "../lib/auth";

function LoginScreen() {
  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/home", // Expo Router path after auth
    });
  };

  return (
    <View>
      <Button onPress={handleGoogleSignIn}>Sign in with Google</Button>
    </View>
  );
}

// apps/mobile/app.json
// Source: https://docs.expo.dev/guides/authentication/
{
  "expo": {
    "scheme": "myapp",
    "ios": {
      "bundleIdentifier": "com.yourcompany.k7notes"
    },
    "android": {
      "package": "com.yourcompany.k7notes",
      "googleServicesFile": "./google-services.json" // From Firebase
    },
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
        }
      ]
    ]
  }
}
```

### Pattern 4: Protected Routes (NestJS)

**What:** Use @Session(), @AllowAnonymous(), and @OptionalAuth() decorators to control endpoint access.

**When to use:** Every NestJS controller - authentication is global by default.

**Example:**

```typescript
// apps/api/src/users/users.controller.ts
// Source: https://www.better-auth.com/docs/integrations/nestjs
import { Controller, Get } from '@nestjs/common';
import { Session, AllowAnonymous, OptionalAuth } from '@thallesp/nestjs-better-auth';

@Controller('users')
export class UsersController {
  @Get('me')
  getCurrentUser(@Session() session: any) {
    // Session required by default (global AuthGuard)
    return session.user;
  }

  @Get('public')
  @AllowAnonymous()
  getPublicData() {
    // No authentication required
    return { message: 'Public endpoint' };
  }

  @Get('optional')
  @OptionalAuth()
  getConditional(@Session() session: any | null) {
    // Session available but not required
    return session ? session.user : { message: 'Not authenticated' };
  }
}
```

### Pattern 5: Drizzle Schema Generation & Migration

**What:** Use better-auth CLI to generate schema, customize if needed, run migrations with drizzle-kit.

**When to use:** Initial database setup and whenever schema changes.

**Example:**

```typescript
// apps/api/drizzle.config.ts
// Source: https://www.better-auth.com/docs/adapters/drizzle
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

// Generate better-auth schema
// $ npx @better-auth/cli generate --adapter drizzle

// apps/api/src/db/schema.ts (generated + extended)
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Better-auth tables (generated)
export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Custom tables (Phase 2+)
export const notes = pgTable("notes", {
  // ... future schema
});

// Run migrations
// $ npx drizzle-kit generate
// $ npx drizzle-kit migrate
```

### Pattern 6: Turborepo Task Pipeline

**What:** Define build dependencies and caching strategy for monorepo tasks.

**When to use:** Root configuration - ensures correct build order and fast rebuilds.

**Example:**

```json
// turbo.json
// Source: https://vercel.com/templates/next.js/turborepo-react-native
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".expo/**", "android/app/build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

### Pattern 7: Shared TypeScript Configuration

**What:** Create base tsconfig with strict mode, use project references for monorepo packages.

**When to use:** Every package needs TypeScript - ensures consistency and type safety.

**Example:**

```json
// packages/typescript-config/base.json
// Source: https://nx.dev/blog/managing-ts-packages-in-monorepos
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "incremental": true
  }
}

// apps/api/tsconfig.json
{
  "extends": "@k7notes/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../../packages/types" }
  ]
}

// apps/mobile/tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  }
}
```

### Anti-Patterns to Avoid

- **Expo Go for Google OAuth:** Google Sign-In requires native configuration, won't work in Expo Go. Use development build (`npx expo run:ios`).
- **Manual Metro config in SDK 52+:** Expo auto-detects monorepos. Don't manually configure `watchFolders` or `nodeModulesPath` - it's deprecated and will conflict.
- **Common dependencies in root package.json:** Keep React, React Native, Expo in app-specific package.json only. Root should have devDependencies only (turbo, typescript, etc.).
- **Missing baseURL in better-auth:** OAuth redirects will fail with redirect_uri_mismatch if baseURL isn't configured. Always set it.
- **Forgetting bodyParser: false in NestJS:** Better-auth needs raw request bodies. NestJS will consume the body before better-auth can read it.
- **Duplicate React/React Native versions:** Monorepos must use exact same version across all packages. Pin versions in root package.json using pnpm's catalog feature or overrides.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flow handling | Custom OAuth implementation | better-auth + expo-auth-session | PKCE, state validation, token refresh, provider quirks already handled |
| Session persistence | AsyncStorage + encryption | expo-secure-store | Platform-specific keychain/keystore, better-auth Expo plugin integration |
| Database migrations | Manual SQL scripts | drizzle-kit | Detects schema changes, generates migrations, tracks migration history |
| Google Sign-In config | Raw OAuth endpoints | @react-native-google-signin/google-signin | Handles iOS/Android native SDKs, credential management |
| Monorepo task orchestration | npm scripts + manual dependencies | Turborepo | Caching, parallelization, dependency graph, incremental builds |
| Type-safe database queries | Raw SQL with manual types | Drizzle ORM | Compile-time type checking, SQL-like syntax, migration tooling |
| Auth tokens & refresh | Manual JWT + refresh logic | better-auth | Automatic token refresh, secure storage, session management |
| Metro bundler in monorepo | Custom metro.config.js | @expo/metro-config (SDK 52+) | Auto-detects workspaces, resolves hoisted dependencies |

**Key insight:** Authentication and OAuth are security-critical with many edge cases (PKCE flows, token expiry, refresh tokens, CSRF protection, secure storage). better-auth is battle-tested and framework-agnostic - don't rebuild it. Similarly, Expo's tooling (SecureStore, AuthSession, Metro config) has been refined over years to handle platform quirks.

## Common Pitfalls

### Pitfall 1: Expo SDK 52+ with Outdated Metro Config

**What goes wrong:** Developers coming from pre-SDK 52 monorepo setups manually configure `watchFolders`, `nodeModulesPath`, or `extraNodeModules` in metro.config.js. This conflicts with Expo's automatic detection, causing cryptic module resolution errors or "Unable to resolve module" failures.

**Why it happens:** Pre-SDK 52 required extensive manual Metro configuration for monorepos. Old tutorials and boilerplates still show this pattern. SDK 52 docs don't prominently warn about removing old configs.

**How to avoid:**
- Use Expo SDK 52 or later
- Delete manual Metro monorepo config if migrating from older setup
- Run `npx expo start --clear` after removing config
- Verify `@expo/metro-config` is using automatic detection

**Warning signs:**
- "Unable to resolve module" errors in monorepo
- Metro bundler not finding packages in parent node_modules
- Build works outside monorepo but fails inside

### Pitfall 2: Google OAuth redirect_uri_mismatch

**What goes wrong:** Google OAuth fails with "redirect_uri_mismatch" error even though redirect URI is configured correctly in Google Cloud Console.

**Why it happens:** better-auth constructs the OAuth callback URL using `baseURL` config. If baseURL is missing or incorrect (e.g., localhost in production), the generated redirect_uri won't match Google's whitelist.

**How to avoid:**
- Always configure `baseURL` in better-auth config
- Use environment variables for different environments
- For local dev: `http://localhost:3000` (no trailing slash)
- For production: `https://yourdomain.com`
- Add ALL redirect URIs to Google Cloud Console (local + production + Expo schemes)

**Warning signs:**
- OAuth flow starts but fails after Google login
- Console error: "redirect_uri_mismatch"
- Better-auth logs show generated callback URL doesn't match config

### Pitfall 3: React Native Duplicate Dependencies

**What goes wrong:** App crashes at runtime with "Invariant Violation: React Native version mismatch" or hooks break with "Invalid hook call." TypeScript shows no errors but app won't run.

**Why it happens:** Monorepo has multiple versions of React or React Native installed due to version mismatches in package.json files. Metro bundler loads different versions for different packages. React's hooks rely on singleton context - multiple instances break this.

**How to avoid:**
- Pin exact versions in root package.json using pnpm overrides or catalog
- Run `pnpm list react react-native` to check for duplicates
- Ensure all packages reference same version (no ^ or ~ ranges)
- Use shared dependency management via workspace protocol

**Warning signs:**
- Runtime errors about version mismatches (not compile errors)
- Hooks fail even though code looks correct
- `pnpm list react` shows multiple versions

### Pitfall 4: NestJS Body Parser Consuming better-auth Requests

**What goes wrong:** better-auth endpoints return 400 Bad Request or empty responses. Login/signup silently fails. No obvious errors in logs.

**Why it happens:** NestJS's default body parser middleware consumes the request body stream before better-auth can read it. better-auth expects raw request bodies for certain operations. Once consumed, the stream can't be re-read.

**How to avoid:**
- Set `bodyParser: false` in NestFactory.create() options
- Apply this BEFORE registering AuthModule
- If you need body parsing elsewhere, selectively enable it per route

**Warning signs:**
- Authentication endpoints return 400 with no error details
- POST requests to /api/auth/* fail
- better-auth logs show "Body already consumed" or similar

### Pitfall 5: expo-secure-store Data Persistence Across Uninstalls (iOS)

**What goes wrong:** On iOS, user uninstalls and reinstalls app, old session data persists, causing authentication state issues (logged in as previous user, stale tokens).

**Why it happens:** iOS preserves Keychain data across app uninstalls when the app is reinstalled with the same bundle identifier. This is an iOS platform behavior, not an Expo bug. Android doesn't do this.

**How to avoid:**
- Document this behavior for users/testers
- Implement explicit logout that clears SecureStore
- On app init, validate stored session with backend (check token expiry)
- Consider version-based migration logic to detect fresh installs

**Warning signs:**
- QA reports "ghost sessions" after reinstall on iOS
- Android behaves differently than iOS
- Users report being logged in after deleting app

### Pitfall 6: Drizzle Schema Out of Sync with better-auth

**What goes wrong:** better-auth errors on startup: "Missing table" or "Column not found." Authentication fails completely.

**Why it happens:** better-auth expects specific tables (user, session, account, verification). Developers manually create schema without using better-auth CLI, or use outdated schema from old better-auth version. Schema doesn't include relations required by better-auth 1.4+.

**How to avoid:**
- Always use `npx @better-auth/cli generate --adapter drizzle` to create initial schema
- When updating better-auth, regenerate schema to get new fields
- Run `npx drizzle-kit migrate` to apply migrations
- Don't manually edit better-auth tables unless you know internal requirements

**Warning signs:**
- better-auth throws database errors on startup
- Login works but session retrieval fails
- Migration tool shows "missing relations"

### Pitfall 7: Google OAuth Refresh Tokens Not Issued

**What goes wrong:** First Google login works, but refresh tokens aren't saved. When access token expires, user must re-authenticate instead of silent refresh.

**Why it happens:** Google only issues refresh tokens on FIRST consent, unless you explicitly configure `accessType: "offline"` and `prompt: "select_account consent"`. Subsequent logins without these flags won't get refresh tokens.

**How to avoid:**
- Set `accessType: "offline"` in better-auth Google provider config
- Use `prompt: "select_account"` to always show account picker
- For forced consent screen: `prompt: "select_account consent"`
- Document that users must re-consent if refresh tokens were missed

**Warning signs:**
- Token refresh fails after initial success
- Users get logged out after ~1 hour (access token expiry)
- better-auth logs show "No refresh token available"

## Code Examples

Verified patterns from official sources:

### Expo Router Protected Routes

```typescript
// apps/mobile/app/(auth)/_layout.tsx
// Source: https://docs.expo.dev/router/advanced/authentication/
import { Redirect, Stack } from "expo-router";
import { authClient } from "../../src/lib/auth";

export default function AuthLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return null; // Or loading screen
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Stack />;
}
```

### Email/Password Sign Up

```typescript
// apps/mobile/src/screens/SignUpScreen.tsx
// Source: https://www.better-auth.com/docs/basic-usage
import { authClient } from "../lib/auth";

async function handleSignUp(email: string, password: string, name: string) {
  const { data, error } = await authClient.signUp.email({
    email,
    password,
    name,
  });

  if (error) {
    console.error("Sign up failed:", error.message);
    return;
  }

  // User is now authenticated, session stored in SecureStore
  console.log("User created:", data.user);
}
```

### Drizzle Database Connection

```typescript
// apps/api/src/db/index.ts
// Source: https://orm.drizzle.team/docs/get-started-postgresql
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

### Logout from Any Screen

```typescript
// apps/mobile/src/components/LogoutButton.tsx
// Source: https://www.better-auth.com/docs/concepts/client
import { authClient } from "../lib/auth";

function LogoutButton() {
  const handleLogout = async () => {
    await authClient.signOut();
    // Session automatically cleared from SecureStore
    // Router will redirect to login (via _layout.tsx check)
  };

  return <Button onPress={handleLogout}>Log Out</Button>;
}
```

### Manual Session Refresh

```typescript
// apps/mobile/src/hooks/useAutoRefresh.ts
// Source: https://www.better-auth.com/docs/concepts/client
import { useEffect } from "react";
import { authClient } from "../lib/auth";

export function useAutoRefresh() {
  const { refetch } = authClient.useSession();

  useEffect(() => {
    // Refresh session when app comes to foreground
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refetch();
      }
    });

    return () => subscription.remove();
  }, [refetch]);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Metro config for monorepos | Auto-detection in Expo SDK 52+ | Nov 2024 | Eliminates configuration errors, works out-of-box |
| Passport.js for auth | better-auth | 2024 | Modern TypeScript, framework-agnostic, less boilerplate |
| Serial types for PG IDs | Identity columns | PostgreSQL 10+ / Drizzle 2025 | Better standards compliance, Drizzle recommends identity |
| react-native-async-storage | expo-secure-store for auth | Ongoing | Encrypted storage for tokens vs plain text |
| Next-Auth (Auth.js) | better-auth | 2024 | Framework-agnostic (not Next.js only), simpler API |
| npm/yarn for RN monorepos | pnpm with isolated deps | Expo SDK 52+ | First-class Expo support, faster installs |
| Custom OAuth flows | expo-auth-session + provider SDKs | Expo SDK 40+ | Handles PKCE, state validation, deep linking |

**Deprecated/outdated:**

- **Bare React Native CLI for monorepos:** Expo SDK 52+ provides everything needed plus automatic monorepo detection. Use Expo unless you have specific native modules incompatible with Expo.
- **@expo/ngrok for dev tunneling:** Expo dropped ngrok support. Use Expo's built-in tunnel service or third-party tools (localtunnel, cloudflared).
- **AsyncStorage for auth tokens:** Not secure. Use expo-secure-store for sensitive data.
- **Manual watchFolders in metro.config.js:** Removed in SDK 52+ automatic monorepo detection. Delete if migrating from older setup.

## Open Questions

Things that couldn't be fully resolved:

1. **Local-first SQLite + PostgreSQL schema sharing with Drizzle**
   - What we know: Drizzle supports both SQLite and PostgreSQL dialects. Community uses separate configs for different dialects pointing to same schema folder. PGlite recommended as drop-in PostgreSQL replacement for local dev.
   - What's unclear: Whether a single Drizzle schema can target both SQLite (mobile) and PostgreSQL (server) without dialect-specific workarounds. Official docs suggest separate schema files or conditional logic.
   - Recommendation: Defer to Phase 2. Use PostgreSQL-only schema in Phase 1. When implementing local-first in Phase 2, investigate: (a) PGlite for local dev to keep PostgreSQL dialect everywhere, (b) separate but parallel schema files for SQLite vs PostgreSQL, or (c) Drizzle's experimental multi-dialect support. Validate with proof-of-concept before committing to approach.

2. **better-auth NestJS integration stability (community-maintained)**
   - What we know: @thallesp/nestjs-better-auth is community-maintained (not official). Requires better-auth 1.3.8+. Provides decorators, guards, hooks. Beta Fastify support.
   - What's unclear: Long-term maintenance commitment, edge case handling, how quickly it tracks better-auth releases.
   - Recommendation: Use it for Phase 1, but abstract auth logic behind service layer (Repository pattern). If integration issues arise, we can fall back to calling better-auth directly without NestJS-specific wrappers. Monitor GitHub issues: https://github.com/ThallesP/nestjs-better-auth

3. **Expo Isolated Dependencies (SDK 54+) compatibility with React Native libraries**
   - What we know: Expo SDK 54+ will support isolated dependencies (like pnpm's default). Not all React Native packages work with isolated installs. Bun and pnpm have first-class support.
   - What's unclear: Which specific libraries in our stack (better-auth, Google Sign-In, etc.) are incompatible. SDK 54 not released yet (as of Jan 2026).
   - Recommendation: Use SDK 52 for Phase 1. When SDK 54 releases, test isolated dependencies in a branch before upgrading. May need to configure .npmrc with `node-linker=hoisted` if issues arise. Track Expo SDK 54 release notes.

4. **EAS Build monorepo configuration for NestJS backend**
   - What we know: EAS Build is designed for Expo apps. Monorepo support is primarily for sharing packages between Expo apps. Run EAS commands from app directory, not root.
   - What's unclear: Whether EAS Build can/should build NestJS backend, or if backend should be deployed separately (e.g., Docker, Railway, Fly.io). EAS documentation focuses on mobile/web, not API servers.
   - Recommendation: Deploy NestJS backend separately from mobile app. Use Railway/Render/Fly.io for backend, EAS Build for Expo app. Keep deployments decoupled. Backend can be deployed more frequently than mobile releases. Alternative: Monorepo CI/CD with GitHub Actions that builds both separately.

## Sources

### Primary (HIGH confidence)

- Better Auth Official Documentation - https://www.better-auth.com/docs/introduction
- Better Auth Expo Integration - https://www.better-auth.com/docs/integrations/expo
- Better Auth NestJS Integration - https://www.better-auth.com/docs/integrations/nestjs
- Better Auth Drizzle Adapter - https://www.better-auth.com/docs/adapters/drizzle
- Better Auth Google OAuth - https://www.better-auth.com/docs/authentication/google
- Better Auth Client Concepts - https://www.better-auth.com/docs/concepts/client
- Expo Monorepo Guide - https://docs.expo.dev/guides/monorepos/
- Expo Authentication Guide - https://docs.expo.dev/develop/authentication/
- Expo SecureStore - https://docs.expo.dev/versions/latest/sdk/securestore/
- Expo Google Authentication - https://docs.expo.dev/guides/google-authentication/
- Drizzle ORM PostgreSQL - https://orm.drizzle.team/docs/get-started-postgresql
- Drizzle Migrations - https://orm.drizzle.team/docs/migrations

### Secondary (MEDIUM confidence)

- GitHub: better-auth/better-auth - https://github.com/better-auth/better-auth
- GitHub: ThallesP/nestjs-better-auth - https://github.com/ThallesP/nestjs-better-auth
- Turborepo React Native Starter - https://vercel.com/templates/next.js/turborepo-react-native
- Setting Up Turborepo with React Native and Next.js (2025) - https://medium.com/better-dev-nextjs-react/setting-up-turborepo-with-react-native-and-next-js-the-2025-production-guide-690478ad75af
- NestJS in 2026: Why It's Still the Gold Standard - https://tyronneratcliff.com/nestjs-for-scaling-backend-systems/
- Expo Local-First Architecture - https://docs.expo.dev/guides/local-first/
- Drizzle ORM PostgreSQL Best Practices (2025) - https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717
- NestJS & DrizzleORM: A Great Match - https://trilon.io/blog/nestjs-drizzleorm-a-great-match
- Managing TypeScript Packages in Monorepos - https://nx.dev/blog/managing-ts-packages-in-monorepos

### Tertiary (LOW confidence - marked for validation)

- Drizzle shared schema SQLite + PostgreSQL discussion - https://github.com/drizzle-team/drizzle-orm/discussions/3396
- Turborepo + React Native common mistakes - https://dev.to/menghif/turborepo-react-native-and-more-2m0h
- better-auth vs NextAuth vs Auth0 comparison - https://betterstack.com/community/guides/scaling-nodejs/better-auth-vs-nextauth-authjs-vs-autho/

## Metadata

**Confidence breakdown:**

- **Standard stack:** MEDIUM - better-auth is newer (2024), less battle-tested than Passport.js, but has official Expo/Drizzle support and active development. Expo + Turborepo + NestJS are mature. Drizzle is proven but newer than Prisma/TypeORM.
- **Architecture:** HIGH - Expo monorepo patterns are well-documented (official guides). better-auth patterns verified from official docs. NestJS + Drizzle integration has community examples and official modules.
- **Pitfalls:** HIGH - Pitfalls verified from official documentation (Expo monorepo migration guide, better-auth OAuth config, SecureStore iOS behavior) and recent community reports (React Native duplicate deps, Metro config).
- **Local-first patterns:** LOW - Deferred to Phase 2. SQLite + PostgreSQL schema sharing needs proof-of-concept. Sync patterns exist (PowerSync, TinyBase) but not yet researched for this stack.

**Research date:** 2026-01-31
**Valid until:** 2026-03-02 (30 days - stack is stable, but better-auth is fast-moving)

**Note:** better-auth is relatively new (emerged 2024) but has strong momentum, official framework integrations, and active maintenance. Version 1.4.15 (published 12 hours ago as of Jan 31, 2026) shows continuous development. If stability becomes a concern, fallback to Clerk (hosted) or custom implementation with Passport.js + expo-auth-session is possible, but better-auth is recommended for TypeScript-first approach and framework flexibility.
