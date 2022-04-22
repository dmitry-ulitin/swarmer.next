import { Category } from './category';
import { Account } from './account';

export enum TransactionType {
    Transfer = 0,
    Expense,
    Income
}

export interface Transaction {
    id?: number | null;
    opdate: Date;
    account?: Account | null;
    account_balance?: number;
    credit: number;
    recipient?: Account | null;
    recipient_balance?: number;
    debit: number;
    category?: Category | null;
    currency: string;
    details: string;
    type: TransactionType;
    bg?: string;
}
