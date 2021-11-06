import { Category } from './category';
import { Account } from './account';

export interface Transaction {
    id: number;
    opdate: Date;
    account: Account;
    credit: number;
    recipient: Account;
    debit: number;
    category: Category;
    currency: string;
    details: string;
    type: number;
    bg: string;
}
