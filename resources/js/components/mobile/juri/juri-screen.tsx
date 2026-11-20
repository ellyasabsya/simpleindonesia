import { Head } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import Avatar from '@/components/user/avatar';
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
                        title={title}
                        back={loggedIn ? '/juri-saya' : undefined}
                        actions={
                            <>
                                <Avatar name={judgeName} src={null} className="h-8 w-8 rounded-full text-sm" />
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
