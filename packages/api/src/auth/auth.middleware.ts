import type {
  ContractProcedure,
  ErrorMap,
  Meta,
} from "@orpc/contract";
import type { AnySchema } from "@orpc/contract";
import { implement, ORPCError } from "@orpc/nest";
import { auth } from "./auth.config.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthSession = {
  id: string;
  userId: string;
  expiresAt: Date;
};

export type AuthContext = {
  user: AuthUser;
  session: AuthSession;
};

export function authed<
  TInputSchema extends AnySchema,
  TOutputSchema extends AnySchema,
  TErrorMap extends ErrorMap,
  TMeta extends Meta,
>(
  contractProcedure: ContractProcedure<
    TInputSchema,
    TOutputSchema,
    TErrorMap,
    TMeta
  >,
) {
  return implement(contractProcedure).use(async ({ context, next }) => {
    const sessionData = await auth.api.getSession({
      headers: context.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      throw new ORPCError("UNAUTHORIZED");
    }

    return next({
      context: {
        user: {
          id: sessionData.user.id,
          email: sessionData.user.email,
          name: sessionData.user.name,
        } satisfies AuthUser,
        session: {
          id: sessionData.session.id,
          userId: sessionData.session.userId,
          expiresAt: sessionData.session.expiresAt,
        } satisfies AuthSession,
      },
    });
  });
}
