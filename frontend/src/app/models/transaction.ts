import { Category } from './category';
import { Account } from './account';

export interface Transaction {
    id: number;
    opdate: Date;
    account?: Account;
    account_balance?: number;
    credit: number;
    recipient?: Account;
    recipient_balance?: number;
    debit: number;
    category: Category;
    currency: string;
    details: string;
    type: number;
    bg: string;
}
