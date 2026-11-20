import type { NavItem } from './nav-types';

export const currentPath = (url: string) => url.split('?')[0].split('#')[0];

export const isActive = (path: string, item: NavItem) =>
    item.exact
        ? path === item.href
        : path === item.href || path.startsWith(`${item.href}/`);
