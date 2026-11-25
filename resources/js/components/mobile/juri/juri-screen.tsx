import { Head } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import AppBar from '../app-bar';
import AppBarButton from '../app-bar-button';
import Screen from '../screen';

type Props = {
    title: string;
    judgeName: string;
    loggedIn: boolean;
    dark: boolean;
    toggleTheme: () => void;
    children: ReactNode;
};

/** Layout penilaian juri khusus HP. Tanpa bottom nav; tombol kembali ke Panel juri jika sudah login. */
export default function JuriScreen({ title, judgeName, loggedIn, dark, toggleTheme, children }: Props) {
    return (
        <>
            <Head title={`${title} - SIMPLE`} />
            <Screen
                bar={
                    <AppBar
                        title={title.split(' - ')[0]}
                        back={loggedIn ? '/juri-saya' : undefined}
                        actions={
                            <>
                                <AppBarButton onClick={toggleTheme} label="Ganti tema">
                                    {dark ? <Sun /> : <Moon />}
                                </AppBarButton>
                            </>
                        }
                    />
                }
            >
                {children}
            </Screen>
        </>
    );
}
