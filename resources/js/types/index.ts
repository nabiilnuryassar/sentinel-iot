import type { Auth } from './auth';

export type * from './auth';

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export interface PageProps {
    auth: Auth;
    name: string;
    flash?: {
        success?: string;
        error?: string;
        new_bot_token?: string;
        agent_response?: {
            response: string;
            conversation_id: string | null;
        };
    };
    [key: string]: unknown;
}
