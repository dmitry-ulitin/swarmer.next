import { Inject, Injectable, Injector, NgZone } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Group } from '../models/group';
import { Amount, Total } from '../models/balance';
import { ApiService } from '../services/api.service';
import { AppLoginSuccess, AppPrintError } from '../app.state';
import { Transaction, TransactionType } from '../models/transaction';
import { Account } from '../models/account';
import { TuiDialogService, TuiNotification, TuiNotificationsService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { firstValueFrom } from 'rxjs';
import { TransactionDlgComponent } from '../transactions/transaction-dlg/transaction-dlg.component';
import { Category } from '../models/category';
import { ConfirmationDlgComponent } from '../confirmation/confirmation-dlg.component';
import { AccountDialogComponent } from './account-dlg/account-dlg.component';

export interface TransactionView extends Transaction {
    name: string;
    amount: Amount;
    balance: { fullname?: string; currency?: string; balance?: number; };
}

export class GetGroups {
    static readonly type = '[Acc] Get Groups';
}

export class SelectAccounts {
    static readonly type = '[Acc] Select Accounts';
    constructor(public accounts: number[]) { }
}

export class ToggleGropup {
    static readonly type = '[Acc] Toggle Group';
    constructor(public group: number) { }
}

export class CreateGroup {
    static readonly type = '[Acc] Create Group';
}

export class EditGroup {
    static readonly type = '[Acc] Edit Group';
    constructor(public group: Group) { }
}

export class GetTransactions {
    static readonly type = '[Acc] Get Transactions';
}

export class SelectTransaction {
    static readonly type = '[Acc] Select Transaction';
    constructor(public id: number) { }
}

export class AddTransaction {
    static readonly type = '[Acc] Add Transaction';
    constructor(public type: TransactionType) { }
}

export class EditTransaction {
    static readonly type = '[Acc] Edit Transaction';
    constructor(public id?: number) { }
}

export class DeleteTransaction {
    static readonly type = '[Acc] Delete Transaction';
    constructor(public id?: number) { }
}

export class GetCategories {
    static readonly type = '[Acc] Get Categories';
}

export interface AccStateModel {
    groups: Group[];
    expanded: number[];
    accounts: number[];
    transactions: TransactionView[];
    transaction_id: number | null;
    categories: Category[];
}

@State<AccStateModel>({
    name: 'acc',
    defaults: {
        groups: [],
        expanded: [],
        accounts: [],
        transactions: [],
        transaction_id: null,
        categories: []
    }
})

@Injectable()
export class AccState {
    constructor(private api: ApiService,
        @Inject(TuiDialogService) private readonly dialogService: TuiDialogService,
        @Inject(Injector) private readonly injector: Injector,
        private readonly notificationsService: TuiNotificationsService,
        private zone: NgZone
    ) { }

    @Selector()
    static total(state: AccStateModel): Amount[] {
        return Object.values(Total.total(state.groups));
    }

    @Selector()
    static selectedGroups(state: AccStateModel): Group[] {
        return state.groups.filter(g => g.accounts.some(a => state.accounts.includes(a.id)));
    }

    @Selector()
    static accounts(state: AccStateModel): Account[] {
        return state.groups.reduce((acc, g) => acc.concat(g.accounts), [] as Account[]).filter(a => !a.deleted);
    }

    @Selector()
    static currencies(state: AccStateModel): string[] {
        return state.groups.reduce((acc, g) => acc.concat(g.accounts), [] as Account[]).filter(a => !a.deleted).map(a => a.currency).filter((v, i, a) => a.indexOf(v) === i);
    }

    ngxsOnInit(ctx: StateContext<AccState>) {
        ctx.dispatch([new GetGroups(), new GetTransactions(), new GetCategories()]);
    }

    @Action([AppLoginSuccess, GetGroups], { cancelUncompleted: true })
    async getGroups(cxt: StateContext<AccStateModel>) {
        try {
            const groups = await firstValueFrom(this.api.getGroups());
            cxt.patchState({ groups });
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(ToggleGropup)
    toggleGropup(cxt: StateContext<AccStateModel>, action: ToggleGropup) {
        const state = cxt.getState();
        if ((state.groups.find(g => g.id === action.group)?.accounts.length || 0) > 1) {
            let expanded = state.expanded.filter(id => id !== action.group);
            if (expanded.length === state.expanded.length) {
                expanded.push(action.group);
            }
            cxt.patchState({ expanded });
        }
    }

    @Action(CreateGroup)
    createGroup(cxt: StateContext<AccStateModel>) {
        this.dialogService.open(
            new PolymorpheusComponent(AccountDialogComponent, this.injector), { header: 'New Account', dismissible: false, size: 's' }
        ).subscribe({
            next: (data: any) => {
                if (data) {
                    this.zone.run(() => this.notificationsService.show('Account created', { status: TuiNotification.Success }).subscribe());
                    const state = cxt.getState();
                    const groups = state.groups.slice();
                    const index = groups.findIndex(g => !g.is_owner);
                    groups.splice(index < 0 ? groups.length : index, 0, data);
                    cxt.patchState({ groups, accounts: data.accounts.map((a: Account) => a.id) });
                }
            }
        });
    }

    @Action(EditGroup)
    editGroup(cxt: StateContext<AccStateModel>, action: EditGroup) {
        this.dialogService.open(
            new PolymorpheusComponent(AccountDialogComponent, this.injector), { data: action.group }
        ).subscribe();
    }

    @Action(SelectTransaction)
    selectTransaction(cxt: StateContext<AccStateModel>, action: SelectTransaction) {
        cxt.patchState({ transaction_id: action.id });
    }

    @Action([AppLoginSuccess, GetTransactions], { cancelUncompleted: true })
    async getTransactions(cxt: StateContext<AccStateModel>) {
        try {
            const state = cxt.getState();
            const transactions = await firstValueFrom(this.api.getTransactions(state.accounts));
            const selected: { [key: number]: boolean } = Object.assign({}, ...state.accounts.map(a => ({ [a]: true })));
            const tv = transactions.map(t => transaction2View(t, selected));
            const transaction_id = tv.find(t => t.id === state.transaction_id)?.id;
            cxt.patchState({ transactions: tv, transaction_id });
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(SelectAccounts)
    selectAccounts(cxt: StateContext<AccStateModel>, action: SelectAccounts) {
        cxt.patchState({ accounts: action.accounts });
        cxt.dispatch(new GetTransactions());
    }

    @Action(EditTransaction)
    async editTransaction(cxt: StateContext<AccStateModel>, action: EditTransaction) {
        try {
            const transaction_id = action.id || cxt.getState().transaction_id;
            if (transaction_id) {
                const transaction = await firstValueFrom(this.api.getTransaction(transaction_id));
                this.zone.run(() => {
                    this.dialogService.open(
                        new PolymorpheusComponent(TransactionDlgComponent, this.injector), { data: transaction, dismissible: false, size: 's' }
                    ).subscribe({
                        next: (data: any) => {
                            if (data) {
                                this.zone.run(() => this.notificationsService.show('Transaction updated', { status: TuiNotification.Success }).subscribe());
                                deleteTransactionFromState(transaction, cxt);
                                addTransactionToState(data, cxt);
                            }
                        }
                    });
                });
            }
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(DeleteTransaction)
    async deleteTransaction(cxt: StateContext<AccStateModel>, action: DeleteTransaction) {
        try {
            const state = cxt.getState();
            const transaction_id = action.id || state.transaction_id;
            if (transaction_id) {
                const answer = await firstValueFrom(
                    this.dialogService.open(new PolymorpheusComponent(ConfirmationDlgComponent, this.injector), { data: 'Are you sure you want to delete this transaction?', dismissible: false, size: 's' }),
                    { defaultValue: false }
                );
                if (answer) {
                    let trx = state.transactions.find(t => t.id === transaction_id) as Transaction;
                    if (!trx) {
                        trx = await firstValueFrom(this.api.getTransaction(transaction_id));
                    }
                    await firstValueFrom(this.api.deleteTransaction(transaction_id));
                    this.zone.run(() => this.notificationsService.show('Transaction deleted').subscribe());
                    deleteTransactionFromState(trx, cxt);
                }
            }
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(AddTransaction)
    addTransaction(cxt: StateContext<AccStateModel>, action: AddTransaction) {
        const state = cxt.getState();
        let account: Account | undefined = state.accounts.length > 0 ? getAccount(state.groups, state.accounts[0]) : state.groups[0]?.accounts[0];
        let recipient: Account | undefined = undefined;
        if (action.type === TransactionType.Transfer) {
            recipient = AccState.accounts(state).find(a => a.id !== account?.id && a.currency === account?.currency);
        } else if (action.type === TransactionType.Income) {
            recipient = account;
            account = undefined;
        }
        let transaction: Transaction = {
            type: action.type,
            opdate: new Date(),
            account: account,
            recipient: recipient,
            category: null,
            currency: account?.currency || recipient?.currency || 'EUR',
            debit: 0,
            credit: 0,
            details: ''
        };
        this.dialogService.open(
            new PolymorpheusComponent(TransactionDlgComponent, this.injector), { data: transaction, dismissible: false, size: 's' }
        ).subscribe({
            next: (data: any) => {
                if (data) {
                    this.zone.run(() => this.notificationsService.show('Transaction created', { status: TuiNotification.Success }).subscribe());
                    addTransactionToState(data, cxt);
                }
            }
        });
    }

    @Action([AppLoginSuccess, GetCategories], { cancelUncompleted: true })
    async getCategories(cxt: StateContext<AccStateModel>) {
        try {
            const categories = await firstValueFrom(this.api.getCategories());
            cxt.patchState({ categories });
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }
}

function patchGroupBalance(groups: Group[], account: Account | null | undefined, amount: number) {
    if (account) {
        const gindex = groups.findIndex(g => g.accounts.find(a => a.id === account.id));
        if (gindex >= 0) {
            groups[gindex] = { ...groups[gindex], accounts: groups[gindex].accounts.slice() };
            const aindex = groups[gindex].accounts.findIndex(a => a.id === account.id);
            const acc = groups[gindex].accounts[aindex];
            if (typeof acc.balance === 'number') {
                acc.balance += amount;
            }
        }
    }
}

function transaction2View(t: Transaction, selected: { [key: number]: boolean }): TransactionView {
    const name = t.account && t.recipient ? t.account.fullname + ' => ' + t.recipient.fullname : t.category?.name || "-";
    const amount = t.account ? { value: t.credit, currency: t.account.currency } : (t.recipient ? { value: t.debit, currency: t.recipient.currency } : { value: t.credit, currency: t.currency });
    const useRecipient = !t.account_balance || t.recipient && t.recipient_balance && selected[t.recipient?.id] && (!t.account || !selected[t.account?.id]);
    const acc = useRecipient ? t.recipient : t.account;
    return { ...t, name: name, amount: amount, balance: { fullname: acc?.fullname, currency: acc?.currency, balance: useRecipient ? t.recipient_balance : t.account_balance } };
}

function deleteTransactionFromState(transaction: Transaction, cxt: StateContext<AccStateModel>) {
    const state = cxt.getState();
    const transactions = state.transactions.slice();
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) {
        // patch transactions balances
        const selected: { [key: number]: boolean } = Object.assign({}, ...state.accounts.map(a => ({ [a]: true })));
        for (let i = index - 1; i >= 0; i--) {
            const trx = transactions[i];
            if (trx.account && typeof trx.account_balance === 'number' && trx.account?.id === transaction.account?.id) {
                trx.account_balance += transaction.credit;
            }
            if (trx.recipient && typeof trx.recipient_balance === 'number' && trx.recipient?.id === transaction.recipient?.id) {
                trx.recipient_balance -= transaction.debit;
            }
            transactions[i] = transaction2View(trx, selected);
        }
        transactions.splice(index, 1);
    }
    // patch group balances
    const groups = state.groups.slice();
    patchGroupBalance(groups, transaction.account, transaction.debit);
    patchGroupBalance(groups, transaction.recipient, -transaction.credit);
    const transaction_id = transaction.id === state.transaction_id ? null : state.transaction_id;
    cxt.patchState({ transactions, groups, transaction_id });
}

function addTransactionToState(transaction: Transaction, cxt: StateContext<AccStateModel>) {
    const state = cxt.getState();
    const transactions = state.transactions.slice();
    const index = transactions.findIndex(t => transaction.opdate > t.opdate);
    if (index >= 0) {
        // patch transactions balances
        const selected: { [key: number]: boolean } = Object.assign({}, ...state.accounts.map(a => ({ [a]: true })));
        for (let i = index - 1; i >= 0; i--) {
            const trx = transactions[i];
            if (trx.account && typeof trx.account_balance === 'number' && trx.account?.id === transaction.account?.id) {
                trx.account_balance += transaction.credit;
            }
            if (trx.recipient && typeof trx.recipient_balance === 'number' && trx.recipient?.id === transaction.recipient?.id) {
                trx.recipient_balance += transaction.debit;
            }
            transactions[i] = transaction2View(trx, selected);
        }
        transactions.splice(index, 0, transaction2View(transaction, selected));
    }
    // patch group balances
    const groups = state.groups.slice();
    patchGroupBalance(groups, transaction.account, -transaction.debit);
    patchGroupBalance(groups, transaction.recipient, transaction.credit);
    const transaction_id = transaction.id;
    cxt.patchState({ transactions, groups, transaction_id });
}

function getAccount(groups: Group[], id: number): Account | undefined {
    return groups.reduce((acc, g) => (acc || g.accounts.find(a => a.id === id)), undefined as Account | undefined);
}
