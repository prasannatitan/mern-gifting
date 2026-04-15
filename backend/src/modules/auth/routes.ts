import { UserRole } from "@prisma/client";
import { badRequest, json, registerRoute, requireRole } from "../../core/router";
import {
  loginUser,
  loginUserForStore,
  registerUser,
  registerUserForStore,
  requestForgotPasswordOtp,
  resetPasswordWithOtp,
  syncStoreOwnersFromStores,
} from "./service";

registerRoute("POST", "/auth/register", async ({ req }) => {
  try {
    const body = await req.json();
    const result = await registerUser(body);
    return json(result, { status: 201 });
  } catch (err) {
    console.error(err);
    return badRequest("Invalid registration data or user already exists");
  }
});

registerRoute("POST", "/auth/login", async ({ req }) => {
  try {
    const body = await req.json();
    const result = await loginUser(body);
    return json(result);
  } catch (err) {
    console.error(err);
    return badRequest("Invalid email or password");
  }
});

// Store frontend only: only STORE_OWNER can log in
registerRoute("POST", "/auth/login/store", async ({ req }) => {
  try {
    const body = await req.json();
    const result = await loginUserForStore(body);
    console.log(result)
    return json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_ALLOWED_FOR_STORE") {
      return json(
        { error: "This site is for store owners only. Use the admin or vendor dashboard to sign in." },
        { status: 403 }
      );
    }
    console.error(err);
    return badRequest("Invalid email or password");
  }
});

// Store frontend only: register always creates STORE_OWNER
registerRoute("POST", "/auth/register/store", async ({ req }) => {
  try {
    const body = await req.json();
    const result = await registerUserForStore(body);
    return json(result, { status: 201 });
  } catch (err) {
    console.error(err);
    return badRequest("Invalid registration data or user already exists");
  }
});

registerRoute("POST", "/auth/forgot-password/request-otp", async ({ req }) => {
  try {
    const body = await req.json();
    const result = await requestForgotPasswordOtp(body);
    return json(result);
  } catch (err) {
    console.error(err);
    return badRequest("Invalid request");
  }
});

registerRoute("POST", "/auth/forgot-password/reset", async ({ req }) => {
  try {
    const body = await req.json();
    const result = await resetPasswordWithOtp(body);
    return json(result);
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error) return badRequest(err.message);
    return badRequest("Invalid request");
  }
});

registerRoute(
  "POST",
  "/auth/sync-store-owners",
  requireRole(async ({ req }) => {
    try {
      const body = (await req.json().catch(() => ({}))) as { defaultPassword?: string };
      const result = await syncStoreOwnersFromStores({ defaultPassword: body.defaultPassword });
      return json(result);
    } catch (err) {
      console.error(err);
      return badRequest("Failed to sync store owners");
    }
  }, [UserRole.CORPORATE_ADMIN]),
);

// Simple endpoint to create initial admin/CEE/vendor/store-owner manually if needed
registerRoute("POST", "/auth/bootstrap-admin", async ({ req }) => {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    name?: string;
    role?: UserRole;
  };

  if (!body.email || !body.password || !body.name || !body.role) {
    return badRequest("email, password, name, role required");
  }

  try {
    const result = await registerUser(body);
    return json(result, { status: 201 });
  } catch (err) {
    console.error(err);
    return badRequest("Failed to bootstrap user");
  }
});

