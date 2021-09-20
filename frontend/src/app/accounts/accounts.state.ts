import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Group } from '../models/group';
import { Amount, Total } from '../models/balance';
import { ApiService } from '../services/api.service';
import { AppLoginSuccess, AppPrintError } from '../app.state';
import { Transaction } from '../models/transaction';
import { Account } from '../models/account';

export interface TransactionView extends Transaction {
    name: string;
    amount: Amount;
    balance: Account;
}

export class GetGroups {
    static readonly type = '[Acc] Get Groups';
}

export class ToggleGropup {
    static readonly type = '[Acc] Toggle Group';
    constructor(public group: number) { }
}

export class SelectAccounts {
    static readonly type = '[Acc] Select Accounts';
    constructor(public accounts: number[]) { }
}

export class GetTransactions {
    static readonly type = '[Acc] Get Transactions';
}

export interface AccStateModel {
    groups: Group[];
    expanded: number[];
    accounts: number[];
    transactions: TransactionView[];
}

@State<AccStateModel>({
    name: 'acc',
    defaults: {
        groups: [],
        expanded: [],
        accounts: [],
        transactions: [],
    }
})

@Injectable()
export class AccState {
    constructor(private api: ApiService) { }

    @Selector()
    static total(state: AccStateModel): Amount[] {
        return Object.values(Total.total(state.groups));
    }

    @Selector()
    static selectedGroups(state: AccStateModel): Group[] {
        return state.groups.filter(g => g.accounts.some(a => state.accounts.includes(a.id)));
    }

    ngxsOnInit(ctx: StateContext<AccState>) {
        ctx.dispatch([new GetGroups(), new GetTransactions()]);
    }

    @Action([AppLoginSuccess, GetGroups], { cancelUncompleted: true })
    async getGroups(cxt: StateContext<AccStateModel>) {
        try {
            const groups = await this.api.getGroups().toPromise();
            cxt.patchState({ groups });
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(ToggleGropup)
    toggleGropup(cxt: StateContext<AccStateModel>, action: ToggleGropup) {
        const state = cxt.getState();
        let expanded = state.expanded.filter(id => id !== action.group);
        if (expanded.length === state.expanded.length) {
            expanded.push(action.group);
        }
        cxt.patchState({ expanded });
    }

    @Action(SelectAccounts)
    selectAccounts(cxt: StateContext<AccStateModel>, action: SelectAccounts) {
        cxt.patchState({ accounts: action.accounts });
        cxt.dispatch(new GetTransactions());
    }

    @Action([AppLoginSuccess, GetTransactions], { cancelUncompleted: true })
    async getTransactions(cxt: StateContext<AccStateModel>) {
        try {
            const state = cxt.getState();
            const transactions = await this.api.getTransactions(state.accounts).toPromise();
            const selected = Object.assign({}, ...state.accounts.map(a => ({[a]: true})));
            const tv = transactions.map(t => {
                const name = t.account && t.recipient ? t.account.full_name + ' => ' + t.recipient.full_name : t.category?.name || "-";
                const amount = t.account ? { value: t.credit, currency: t.account.currency } : (t.recipient ? { value: t.debit, currency: t.recipient.currency } : { value: t.credit, currency: t.currency });
                const useRecipient = t.recipient?.balance && (!t.account?.balance || selected[t.recipient?.id] && !selected[t.account?.id]);
                const acc = useRecipient ? t.recipient : t.account;
                return { ...t, name: name, amount: amount, balance: acc };
            });
            cxt.patchState({ transactions: tv });
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }
}
