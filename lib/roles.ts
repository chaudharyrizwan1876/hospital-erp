export const ROLES = [
  "Admin",
  "Doctor",
  "Receptionist",
  "Pharmacist",
  "HR Manager",
] as const;

export type Role = (typeof ROLES)[number];

// Path prefixes each role is allowed to open. "/" only matches the exact
// dashboard route; everything else matches by prefix (e.g. "/pharmacy"
// covers "/pharmacy/sales" and "/pharmacy/returns").
export const ROLE_ROUTES: Record<Role, string[]> = {
  Admin: ["*"],
  Doctor: ["/", "/patients", "/appointments", "/records"],
  Receptionist: ["/", "/patients", "/appointments", "/billing", "/ledger"],
  Pharmacist: ["/", "/pharmacy"],
  "HR Manager": ["/", "/employees", "/attendance", "/leaves", "/payroll"],
};

export function isRouteAllowed(role: string, pathname: string): boolean {
  const allowed = ROLE_ROUTES[role as Role];
  if (!allowed) return false;
  if (allowed.includes("*")) return true;
  return allowed.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")
  );
}

// First route a role should land on if it hits something it can't access.
export function defaultRouteFor(role: string): string {
  const allowed = ROLE_ROUTES[role as Role];
  if (!allowed || allowed.includes("*")) return "/";
  return allowed[0] === "/" ? allowed[1] ?? "/" : allowed[0];
}
