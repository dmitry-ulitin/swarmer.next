import { Category } from "./category";

export interface CategorySum {
    category?: Category | null;
    currency: string;
    amount: number;
}