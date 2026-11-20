import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppBar from '../app-bar';
import type { AppBarProps } from '../app-bar-types';
import MobileBottomNav from '../bottom-nav';
import Screen from '../screen';

type Props = Pick<AppBarProps, 'title' | 'back' | 'actions' | 'large'> & { children: ReactNode };

/** Kerangka HP untuk halaman publik: app bar + bottom nav yang sama dengan halaman peserta. */
export default function PublicScreen({ title, back, actions, large, children }: Props) {
    const { auth } = usePage<{ auth?: { user?: unknown } }>().props;

    return (
        <>
            <Screen bottomNav bar={<AppBar title={title} back={back} actions={actions} large={large} />}>
                {children}
            </Screen>
            <MobileBottomNav variant={auth?.user ? 'user' : 'public'} />
        </>
    );
}
