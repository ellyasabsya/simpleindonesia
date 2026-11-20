import type { ReactNode } from 'react';

export type AuthScreenProps = {
    pageTitle: string;
    badge: string;
    title: string;
    subtitle: string;
    dark: boolean;
    toggleTheme: () => void;
    children: ReactNode;
};
