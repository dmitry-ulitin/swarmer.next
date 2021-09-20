import { Account } from './account';
import { Amount } from './balance';
import { User } from './user';
/* eslint-disable @typescript-eslint/naming-convention */

export interface Group {
    id: number;
    name: string;
    full_name?: string;
    belong?: number;
    visible?: boolean;
    inbalance?: boolean;
    deleted?: boolean;
    accounts: Account[];
    permissions?: Permission[];
}

export interface Permission {
    user: User;
    write: boolean;
    admin: boolean;
}


