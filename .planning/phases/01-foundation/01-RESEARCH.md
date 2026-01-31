# Phase 1: Foundation - Research

**Researched:** 2026-01-31
**Domain:** Cross-platform React Native app with authentication backend
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundation for a cross-platform (iOS, Android, web) note-taking app using React Native with Expo, backed by a NestJS API with PostgreSQL. The standard approach uses Turborepo for monorepo management, Expo SDK 54+ for cross-platform development, and react-native-app-auth for OAuth2 with PKCE. For the backend, NestJS 11 with Passport.js provides authentication, while Drizzle ORM manages database operations across both PostgreSQL (server) and SQLite (mobile).

Key findings show that Expo SDK 52+ automatically configures Metro for monorepos, eliminating previous configuration headaches. The security model mandates using platform-native secure storage (Keychain on iOS, EncryptedSharedPreferences on Android) for tokens—never AsyncStorage. The shared schema pattern between SQLite and PostgreSQL requires careful handling of dialect differences, with Drizzle's TypeScript-first approach providing type safety across both environments.

**Primary recommendation:** Use Expo-managed workflow with Turborepo monorepo structure, implement OAuth2 with PKCE via react-native-app-auth, store tokens in expo-secure-store, and use Drizzle ORM with separate but parallel schema definitions for SQLite and PostgreSQL.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Native | 0.83 | Mobile framework | Industry standard, 4.5M weekly downloads, New Architecture stable |
| Expo SDK | 54+ (55 beta) | Development framework | First-class monorepo support since SDK 52, automatic Metro config |
| Turborepo | Latest | Monorepo orchestration | Official Vercel support, React Native starter template available |
| NestJS | 11.1.x | API framework | TypeScript-native, modular architecture, enterprise-proven |
| PostgreSQL | 16+ | Server database | Production standard for relational data, full Drizzle support |
| Drizzle ORM | 0.45.x | Database ORM | TypeScript-first, zero dependencies, 31KB, supports PostgreSQL + SQLite |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-app-auth | Latest | OAuth2/OIDC flows | Google OAuth, PKCE support, RFC 8252 compliant |
| expo-secure-store | Latest | Token storage | Storing JWT tokens, refresh tokens, sensitive session data |
| @nestjs/passport | Latest | Auth middleware | Implementing authentication strategies in NestJS |
| passport-jwt | Latest | JWT strategy | Validating JWT tokens in NestJS endpoints |
| bcrypt | Latest | Password hashing | Hashing passwords for email/password auth |
| drizzle-kit | Latest | Schema migrations | Generating and running database migrations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Expo | Bare React Native | Expo simplifies config, bare RN gives more native control but requires manual setup |
| react-native-app-auth | expo-auth-session | App-auth is more battle-tested for native OAuth; expo-auth-session better for Expo-only projects |
| Drizzle ORM | Prisma or TypeORM | Drizzle is lighter (31KB vs 9MB+), SQL-native; Prisma has better tooling/docs; TypeORM more mature |
| expo-secure-store | react-native-encrypted-storage | Both use Keychain/Keystore; encrypted-storage has more downloads, secure-store is Expo-integrated |
| Turborepo | Nx or Yarn Workspaces | Turborepo simpler, React Native templates; Nx more powerful; Yarn Workspaces lower-level |

**Installation:**
```bash
# Initialize Turborepo with React Native template
npx create-turbo@latest -e with-react-native-web

# Add Expo dependencies (in apps/mobile)
cd apps/mobile
npx expo install expo-secure-store expo-auth-session

# Add OAuth library
npm install react-native-app-auth

# Backend (in apps/api)
cd apps/api
npm install @nestjs/core @nestjs/common @nestjs/platform-express
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
npm install drizzle-orm pg
npm install -D drizzle-kit @types/passport-jwt @types/bcrypt @types/pg

# Shared packages (in packages/db)
npm install drizzle-orm
npm install -D drizzle-kit
```

## Architecture Patterns

### Recommended Project Structure
```
k7notes/
├── apps/
│   ├── mobile/              # Expo app (iOS/Android/Web)
│   │   ├── app/            # Expo Router v5 file-based routing
│   │   ├── components/     # React Native components
│   │   ├── hooks/          # Custom hooks (useAuth, useSession)
│   │   ├── services/       # API clients, auth service
│   │   └── metro.config.js # Auto-configured by Expo SDK 52+
│   └── api/                # NestJS backend
│       ├── src/
│       │   ├── auth/       # Auth module (strategies, guards, controllers)
│       │   ├── users/      # User module
│       │   ├── database/   # Database module (Drizzle connection)
│       │   └── main.ts     # Bootstrap
│       └── drizzle.config.ts
├── packages/
│   ├── db/                 # Shared database schemas
│   │   ├── schema/         # Drizzle schema definitions
│   │   │   ├── users.ts
│   │   │   └── index.ts
│   │   └── migrations/     # SQL migration files
│   ├── types/              # Shared TypeScript types
│   └── config/             # Shared configs (eslint, tsconfig)
├── turbo.json              # Turborepo pipeline config
└── package.json            # Workspace root
```

### Pattern 1: OAuth2 with PKCE (React Native)
**What:** Authorization Code Flow with Proof Key for Code Exchange for native mobile OAuth
**When to use:** Any OAuth provider (Google, GitHub, etc.) in React Native apps
**Example:**
```typescript
// Source: https://github.com/FormidableLabs/react-native-app-auth
import { authorize, refresh, revoke } from 'react-native-app-auth';

const config = {
  issuer: 'https://accounts.google.com',
  clientId: '{GOOGLE_OAUTH_APP_GUID}.apps.googleusercontent.com',
  redirectUrl: 'com.googleusercontent.apps.{GOOGLE_OAUTH_APP_GUID}:/oauth2redirect/google',
  scopes: ['openid', 'profile', 'email'],
};

// Login flow
const authState = await authorize(config);
// Returns: { accessToken, refreshToken, idToken, accessTokenExpirationDate }

// Store tokens securely
await SecureStore.setItemAsync('access_token', authState.accessToken);
await SecureStore.setItemAsync('refresh_token', authState.refreshToken);

// Refresh token when expired
const refreshedState = await refresh(config, {
  refreshToken: authState.refreshToken,
});
```

### Pattern 2: Secure Token Storage
**What:** Platform-native encrypted storage for authentication tokens
**When to use:** Storing JWT tokens, refresh tokens, any sensitive session data
**Example:**
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/securestore/
import * as SecureStore from 'expo-secure-store';

// CORRECT: Use SecureStore for tokens
async function saveToken(key: string, value: string) {
  await SecureStore.setItemAsync(key, value);
}

async function getToken(key: string) {
  return await SecureStore.getItemAsync(key);
}

// INCORRECT: NEVER use AsyncStorage for sensitive data
// ❌ await AsyncStorage.setItem('token', accessToken); // INSECURE!
```

### Pattern 3: NestJS JWT Authentication with Passport
**What:** JWT-based authentication using Passport.js strategies in NestJS
**When to use:** Protecting API endpoints, validating user sessions
**Example:**
```typescript
// Source: https://docs.nestjs.com/security/authentication
// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}

// Protected route
@Controller('users')
export class UsersController {
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user; // From JWT payload
  }
}
```

### Pattern 4: Drizzle Schema with Migrations
**What:** Type-safe database schema definitions with automated migration generation
**When to use:** Defining database tables, generating SQL migrations
**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/migrations
// packages/db/schema/users.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  googleId: varchar('google_id', { length: 255 }).unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Migration workflow
// 1. Update schema file
// 2. Run: drizzle-kit generate
// 3. Run: drizzle-kit migrate
```

### Pattern 5: Monorepo Package Dependencies
**What:** Workspace protocol for linking internal packages in Turborepo
**When to use:** Sharing code between apps (mobile + API) and packages
**Example:**
```json
// apps/mobile/package.json
{
  "name": "mobile",
  "dependencies": {
    "@k7notes/db": "*",
    "@k7notes/types": "*"
  }
}

// .npmrc (CRITICAL for React Native)
node-linker=hoisted
shamefully-hoist=true
```

### Anti-Patterns to Avoid
- **AsyncStorage for tokens:** AsyncStorage is unencrypted. Always use SecureStore/Keychain for sensitive data
- **WebView for OAuth:** Security risk, violates RFC 8252. Use react-native-app-auth with native browser flows
- **Committing .env files:** Never commit secrets to git. Use environment variables and .env.example
- **Manual Metro config in SDK 52+:** Expo auto-configures Metro for monorepos; manual config causes conflicts
- **Duplicate React Native versions:** Monorepos MUST have single RN version; duplicates cause runtime crashes
- **Hardcoded JWT secrets:** Use environment variables and key rotation for production

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth2 flows | Custom OAuth implementation | react-native-app-auth | PKCE, RFC 8252 compliance, state verification, token refresh, platform-native browsers |
| Secure storage | Encrypted AsyncStorage wrapper | expo-secure-store or react-native-keychain | Platform-native Keychain/Keystore, hardware-backed encryption, OS-level security |
| Database migrations | Custom SQL scripts | drizzle-kit generate + migrate | Automatic diffing, rollback support, TypeScript schema as source of truth |
| JWT validation | Manual JWT parsing | @nestjs/jwt + passport-jwt | Token expiration, signature verification, refresh token rotation, guard integration |
| Password hashing | crypto.createHash() | bcrypt | Salting, work factor tuning, timing attack resistance |
| Monorepo task orchestration | Custom bash scripts | Turborepo | Dependency graph, caching, parallel execution, incremental builds |
| Database connection pooling | Manual connection management | Drizzle + pg pool | Connection limits, idle timeout, reconnection logic, transaction management |

**Key insight:** Authentication and security are areas where "NIH syndrome" (Not Invented Here) causes the most pain. These libraries exist because OAuth2, PKCE, Keychain APIs, and JWT validation have subtle edge cases (state CSRF, token expiration races, PKCE verifier mismatch) that take years to discover. Use battle-tested libraries.

## Common Pitfalls

### Pitfall 1: Duplicate React Native Versions in Monorepo
**What goes wrong:** App crashes at runtime with "Tried to register two views with the same name" or Metro bundler fails
**Why it happens:** Multiple apps or packages specify different react-native versions, causing hoisting conflicts
**How to avoid:**
- Enforce single RN version in root package.json with `resolutions` (Yarn) or `overrides` (npm)
- Run `npm why react-native` or `yarn why react-native` to detect duplicates
- Use Turborepo's workspace dependencies with `"*"` version for internal packages
**Warning signs:** Build errors mentioning "duplicate module", Metro bundler crashes, runtime errors about view managers

### Pitfall 2: Storing Tokens in AsyncStorage
**What goes wrong:** Access tokens stored in plain text, vulnerable to device compromise or malicious apps
**Why it happens:** AsyncStorage is familiar and easy, but provides zero encryption
**How to avoid:**
- ALWAYS use expo-secure-store (Expo) or react-native-keychain (bare RN)
- AsyncStorage is ONLY for non-sensitive data (UI preferences, feature flags)
- Audit code for `AsyncStorage.setItem('token'` patterns
**Warning signs:** Security audit flags, tokens visible in device backups, compliance failures

### Pitfall 3: Missing PKCE in OAuth2 Flow
**What goes wrong:** Authorization codes can be intercepted by malicious apps, leading to account takeover
**Why it happens:** Developers use older OAuth examples or libraries without PKCE support
**How to avoid:**
- Use react-native-app-auth which implements PKCE by default
- Verify OAuth provider supports PKCE (Google, GitHub, etc. all do)
- Never use WebView for OAuth (RFC 8252 violation)
**Warning signs:** OAuth flow works but security audit fails, redirect URIs can be hijacked

### Pitfall 4: Package Hoisting Issues in Monorepo
**What goes wrong:** Native modules not found, Metro bundler can't resolve dependencies, build failures
**Why it happens:** React Native expects flat node_modules, but package managers may not hoist correctly
**How to avoid:**
- Set `node-linker=hoisted` in .npmrc for pnpm
- Avoid `nohoist` (defeats monorepo benefits)
- Use Expo SDK 52+ which auto-configures Metro for monorepos
**Warning signs:** "Cannot find module react-native", Metro errors, Gradle build failures

### Pitfall 5: Inadequate Validation in NestJS
**What goes wrong:** SQL injection, server crashes, data corruption from malformed requests
**Why it happens:** Developers skip validation pipes or use weak validators
**How to avoid:**
- Use `class-validator` with DTOs for all inputs
- Enable `whitelist: true` in ValidationPipe to strip unknown properties
- Never trust client data, especially in authentication endpoints
**Warning signs:** 500 errors on malformed requests, database errors in logs, security audit findings

### Pitfall 6: Hardcoded Secrets and Credentials
**What goes wrong:** API keys, JWT secrets committed to git, exposed in app bundles or public repos
**Why it happens:** Quick prototyping with hardcoded values that never get refactored
**How to avoid:**
- Use .env files with dotenv library, NEVER commit .env to git
- Provide .env.example with placeholder values
- Use server-side proxies for API keys (AWS Lambda, Cloud Functions)
- Rotate secrets if accidentally committed
**Warning signs:** Git history contains API keys, .env in tracked files, secrets in app bundle

### Pitfall 7: Shared Schema Assumptions Between PostgreSQL and SQLite
**What goes wrong:** Schema definition works on server but fails on mobile, or vice versa
**Why it happens:** PostgreSQL and SQLite have different column types, constraints, and features
**How to avoid:**
- Maintain separate schema files (schema/postgres.ts, schema/sqlite.ts) with parallel structures
- Test migrations on both databases
- Avoid PostgreSQL-specific features (JSONB, arrays, enums) in shared tables
- Document dialect differences in comments
**Warning signs:** Migration works on server but fails on mobile, type mismatches, constraint errors

### Pitfall 8: Missing Rate Limiting on Auth Endpoints
**What goes wrong:** Brute force attacks on login, credential stuffing, account takeover
**Why it happens:** Focus on functionality over security in early development
**How to avoid:**
- Use @nestjs/throttler for rate limiting
- Apply stricter limits to /auth/login, /auth/register endpoints
- Implement exponential backoff on failed attempts
- Log failed authentication attempts
**Warning signs:** Spike in failed login attempts, slow response times, account compromises

## Code Examples

Verified patterns from official sources:

### Email/Password Registration with NestJS
```typescript
// Source: https://docs.nestjs.com/security/authentication
// auth.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await this.usersService.create({
      email,
      passwordHash,
    });

    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      // Add refresh token logic here
    };
  }
}
```

### Protected Routes with Expo Router
```typescript
// Source: https://docs.expo.dev/develop/authentication/
// app/(auth)/_layout.tsx - Protected route layout
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Stack />;
}
```

### Drizzle Database Connection (NestJS)
```typescript
// Source: https://orm.drizzle.team/docs/get-started/postgresql-new
// database.module.ts
import { Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@k7notes/db/schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: async () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
```

### Platform-Specific Code in React Native
```typescript
// Source: https://reactnative.dev/docs/platform-specific-code
import { Platform, StyleSheet } from 'react-native';

// Method 1: Platform.select()
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        backgroundColor: 'white',
      },
      android: {
        backgroundColor: 'blue',
      },
      web: {
        backgroundColor: 'gray',
      },
    }),
  },
});

// Method 2: Platform.OS
if (Platform.OS === 'ios') {
  // iOS-specific logic
}

// Method 3: File extensions
// Component.ios.tsx - iOS implementation
// Component.android.tsx - Android implementation
// Component.tsx - Fallback for other platforms
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Metro config for monorepos | Auto-config by Expo SDK 52+ | November 2025 (SDK 52) | Eliminates watchFolders, nodeModulesPath configuration complexity |
| React Native 0.7x with Bridge | React Native 0.83 with New Architecture (Fabric, JSI) | December 2025 | 40% faster cold starts, 20-30% less memory with Hermes |
| Serial columns in PostgreSQL | Identity columns | 2025 | Drizzle ORM embraces identity, better standard compliance |
| OAuth without PKCE | OAuth2 with PKCE required | RFC 8252 (2017), enforced 2020+ | Mobile apps must use PKCE, no longer optional |
| Expo managed vs bare workflow | Unified Expo workflow with CNG | SDK 50+ (2024) | Config plugins eliminate workflow split |
| TypeORM as default NestJS ORM | Drizzle or Prisma preferred | 2025 | TypeORM maintenance slowed, Drizzle lighter/faster |

**Deprecated/outdated:**
- **WebView OAuth flows**: Violates RFC 8252, replaced by ASWebAuthenticationSession (iOS) / Custom Tabs (Android)
- **AsyncStorage for tokens**: Never was secure, but commonly misused; replaced by SecureStore/Keychain
- **Manual monorepo Metro configs**: SDK 52+ auto-detects workspaces
- **react-native-community/async-storage**: Moved to @react-native-async-storage/async-storage (community package)

## Open Questions

Things that couldn't be fully resolved:

1. **Shared Schema Between SQLite and PostgreSQL**
   - What we know: Drizzle supports both, but dialect differences exist (JSONB, arrays, constraints)
   - What's unclear: Best pattern for maintaining parallel schemas vs single schema with conditional features
   - Recommendation: Start with separate schema files (postgres.ts, sqlite.ts) with parallel structures, share TypeScript types only

2. **Expo vs Bare React Native for This Project**
   - What we know: Expo SDK 52+ supports monorepos well, provides SecureStore, AuthSession
   - What's unclear: Whether Expo's abstraction layer will limit future native module needs (audio recording, background tasks in Phase 3)
   - Recommendation: Start with Expo for Phase 1, evaluate in Phase 3 when audio requirements are clear; Expo can eject if needed

3. **Token Refresh Strategy**
   - What we know: Need both access and refresh tokens, refresh before expiration
   - What's unclear: Client-side vs server-side refresh, automatic retry on 401
   - Recommendation: Implement refresh token rotation (NestJS issues new refresh token on each refresh), client-side automatic retry with axios interceptor

4. **Monorepo Package Manager Choice**
   - What we know: pnpm requires hoisting config, Yarn 1 classic works well, Expo supports Bun
   - What's unclear: Performance tradeoffs for this specific stack
   - Recommendation: Start with pnpm + hoisting (fastest, most popular in 2026), document .npmrc requirements

## Sources

### Primary (HIGH confidence)
- [React Native Official Documentation - Security](https://reactnative.dev/docs/security) - Secure storage guidance, OAuth best practices
- [Expo Monorepo Documentation](https://docs.expo.dev/guides/monorepos/) - Official SDK 52+ auto-config, hoisting requirements
- [Expo Authentication Guide](https://docs.expo.dev/develop/authentication/) - OAuth flows, session management
- [Drizzle ORM Migrations Documentation](https://orm.drizzle.team/docs/migrations) - Official migration workflow
- [Drizzle ORM Overview](https://orm.drizzle.team/docs/overview) - Core features and philosophy
- [React Native App Auth GitHub](https://github.com/FormidableLabs/react-native-app-auth) - PKCE implementation, platform setup
- [React Native Platform-Specific Code](https://reactnative.dev/docs/platform-specific-code) - Official cross-platform patterns

### Secondary (MEDIUM confidence)
- [React Native 0.83 Release Notes](https://github.com/facebook/react-native/releases) - Current stable version features
- [Expo SDK 55 Beta Announcement](https://expo.dev/changelog/sdk-55-beta) - Latest SDK features
- [NestJS 11 Release](https://github.com/nestjs/nest/releases) - Current version capabilities
- [Drizzle ORM Latest Releases](https://orm.drizzle.team/docs/latest-releases) - Version 0.45.x features
- [Setting Up Turborepo with React Native and Next.js (2025)](https://medium.com/better-dev-nextjs-react/setting-up-turborepo-with-react-native-and-next-js-the-2025-production-guide-690478ad75af) - Production setup guide
- [Turborepo React Native Starter Template](https://vercel.com/templates/next.js/turborepo-react-native) - Official Vercel template
- [NestJS Drizzle ORM Integration (Trilon)](https://trilon.io/blog/nestjs-drizzleorm-a-great-match) - Integration patterns
- [React Native Best Practices 2026](https://www.esparkinfo.com/blog/react-native-best-practices) - Performance and architecture guidance

### Tertiary (LOW confidence - requires validation)
- [React Native Monorepo Common Mistakes](https://dev.to/menghif/turborepo-react-native-and-more-2m0h) - Community pitfalls
- [NestJS Security Best Practices](https://dev.to/drbenzene/best-security-implementation-practices-in-nestjs-a-comprehensive-guide-2p88) - Security patterns
- [Drizzle vs Prisma 2026 Comparison](https://medium.com/@codabu/drizzle-vs-prisma-choosing-the-right-typescript-orm-in-2026-deep-dive-63abb6aa882b) - ORM tradeoffs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs and npm trends confirm React Native 0.83, Expo 54+, NestJS 11, Drizzle 0.45.x
- Architecture: HIGH - Expo and NestJS official docs provide authoritative patterns
- OAuth/Security: HIGH - RFC 8252, official React Native security docs, react-native-app-auth docs
- Monorepo setup: MEDIUM - Expo SDK 52+ features verified, but Turborepo + React Native has known edge cases
- Shared schema: MEDIUM - Drizzle supports both databases, but production patterns require validation
- Pitfalls: MEDIUM - Sourced from community experience and official warnings, not exhaustive

**Research date:** 2026-01-31
**Valid until:** 2026-03-02 (30 days - React Native ecosystem is fast-moving, Expo releases quarterly)
