# Migrate auth from NestJS guards to oRPC middleware
- **Type**: 🐛 Fix
- **Status**: 🔄 IN_PROGRESS
- **Description**: Replace the AuthGuard + `as unknown as AuthenticatedRequest` cast pattern with oRPC middleware that injects a typed `context.user`. This eliminates unsafe double casts in every controller handler. See oRPC's Better Auth integration guide (https://orpc.dev/docs/integrations/better-auth) for the recommended pattern. Scope: create an auth middleware in oRPC, update all controllers to use `context.user` instead of casting `context.request`, remove AuthGuard and AuthenticatedRequest if no longer needed.
