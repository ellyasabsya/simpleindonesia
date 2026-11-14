export type InstitutionRow = {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: 'pending' | 'approved' | 'rejected';
    member_name: string | null;
    member_email: string | null;
    created_at: string | null;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

export type AppNotification = {
    id: string;
    title: string;
    message: string;
    url: string | null;
    read: boolean;
    created_at: string | null;
};

export type NotificationsProp = {
    unread_count: number;
    items: AppNotification[];
} | null;
