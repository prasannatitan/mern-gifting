import { UserRole } from "@prisma/client";
import { badRequest, json, registerRoute } from "../../core/router";
import { loginUser, registerUser } from "./service";

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

