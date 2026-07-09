export function filterByPermission(items, can) {
  return items
    .map((item) => {
      const children = item.children ? filterByPermission(item.children, can) : undefined;
      const allowed = !item.permission || can(item.permission) || (!item.requireParentPermission && children?.length);
      return allowed ? { ...item, children } : null;
    })
    .filter(Boolean);
}

export function isItemActive(item, pathname) {
  if (item.path && (pathname === item.path || (!item.end && pathname.startsWith(`${item.path}/`)))) {
    return true;
  }
  return item.children?.some((child) => isItemActive(child, pathname));
}
