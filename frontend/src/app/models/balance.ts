export interface Amount { value: number; currency: string };

export interface Balance { [currency: string]: Amount }

export abstract class Total {
    static total(amount: any): Balance {
        const balance: Balance = {};
        return Total.add(balance, amount);
    }

    static add(balance: Balance, amount: any): Balance {
        if (amount instanceof Array) {
            for (const a of amount) {
                Total.add(balance, a);
            }
        } else if ('accounts' in amount) {
            Total.add(balance, amount.accounts);
        } else if ('currency' in amount && amount.currency) {
            const a = balance[amount.currency] || { value: 0, currency: amount.currency };
            a.value += amount.balance || amount.value || 0;
            balance[amount.currency] = a;
        }
        return balance;
    }
}
