export const routePermissions: Record<string, string> = {
  "/dashboard": "dashboard.view",
  "/products": "products.view",
  "/products/categories": "categories.view",
  "/products/attributes": "attributes.view",
  "/orders": "orders.view",
  "/orders/returns": "returns.view",
  "/users": "users.view",
  "/users/addresses": "addresses.view",
  "/users/permissions": "permissions.view",
  "/users/permissions/roles": "roles.view",
  "/finance/payments": "payments.view",
  "/finance/transactions": "transactions.view",
  "/finance/discounts": "discounts.view",
  "/finance/gateway": "payment_gateways.view",
  "/shipping": "shipping.view",
  "/reports": "reports.view",
  "/messages": "messages.view",
  "/settings": "settings.view",
};

// تابع یافتن مجوز بر اساس مسیر
export function getRequiredPermission(pathname: string): string | undefined {
  // بررسی دقیق مسیر
  if (routePermissions[pathname]) {
    return routePermissions[pathname];
  }

  // بررسی پیشوند برای زیرمسیرها (مثلاً /users/123/edit)
  for (const route in routePermissions) {
    if (pathname.startsWith(route + "/")) {
      return routePermissions[route];
    }
  }

  return undefined;
}