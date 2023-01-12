import { Inject, Injectable, Injector, NgZone } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Group } from '../models/group';
import { Amount, Total } from '../models/balance';
import { ApiService } from '../services/api.service';
import { AppLoginSuccess, AppPrintError } from '../app.state';
import { Transaction, TransactionImport, TransactionType } from '../models/transaction';
import { Account } from '../models/account';
import { TuiAlertService, TuiDialogService, TuiNotification } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { TransactionDlgComponent } from '../transactions/transaction-dlg/transaction-dlg.component';
import { Category } from '../models/category';
import { ConfirmationDlgComponent } from '../confirmation/confirmation-dlg.component';
import { AccountDialogComponent } from './account-dlg/account-dlg.component';
import { InputFileDlgComponent } from '../import/input-file-dlg.component';
import { ImportDlgComponent } from '../import/import-dlg.component';
import * as moment from 'moment';
import { Summary } from '../models/summary';
import { Filter } from '../models/filter';
import { DateRange } from '../models/date-range';
import { CategorySum } from '../models/category-sum';

const GET_TRANSACTIONS_LIMIT: number = 100;

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

export class DeselectAccounts {
    static readonly type = '[Acc] Deselect Accounts';
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

export class DeleteGroup {
    static readonly type = '[Acc] Delete Group';
    constructor(public id?: number) { }
}

export class GetTransactions {
    static readonly type = '[Acc] Get Transactions';
}

export class ScrollTransactions {
    static readonly type = '[Acc] Scroll Transactions';
}

export class GetSummary {
    static readonly type = '[Acc] Get Summary';
}

export class SelectTransaction {
    static readonly type = '[Acc] Select Transaction';
    constructor(public id: number) { }
}

export class CreateTransaction {
    static readonly type = '[Acc] Create Transaction';
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

export class ImportTransactions {
    static readonly type = '[Acc] Import Transactions';
    constructor(public id?: number) { }
}

export class GetCategories {
    static readonly type = '[Acc] Get Categories';
}

export class SetCategory {
    static readonly type = '[Acc] Set Category';
    constructor(public category: Category | null) { }
}

export class SetSearch {
    static readonly type = '[Acc] Set Search';
    constructor(public search: string) { }
}

export class SetRange {
    static readonly type = '[Acc] Set Range';
    constructor(public range: DateRange) { }
}

export interface AccStateModel {
    // groups
    groups: Group[];
    expanded: number[];
    accounts: number[];
    // transactions
    transactions: TransactionView[];
    transaction_id: number | null;
    summary: Summary[];
    expenses: CategorySum[];
    // filters
    search: string;
    range: DateRange;
    category: Category | null;

    categories: Category[];
    loaded: boolean;
}

@State<AccStateModel>({
    name: 'acc',
    defaults: {
        groups: [],
        expanded: [],
        accounts: [],
        transactions: [],
        transaction_id: null,
        summary: [],
        expenses: [],
        search: '',
        range: DateRange.last30(),
        category: null,
        categories: [],
        loaded: false
    }
})

@Injectable()
export class AccState {
    constructor(private api: ApiService,
        @Inject(TuiDialogService) private readonly dialogService: TuiDialogService,
        @Inject(Injector) private readonly injector: Injector,
        private readonly alertService: TuiAlertService,
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
    static selectedGroup(state: AccStateModel): Group | undefined {
        const groups = AccState.selectedGroups(state);
        return groups.length === 1 ? groups[0] : undefined;
    }

    @Selector()
    static accounts(state: AccStateModel): Account[] {
        return state.groups.filter(g => !g.deleted).reduce((acc, g) => acc.concat(g.accounts), [] as Account[]).filter(a => !a.deleted);
    }

    @Selector()
    static selectedAccounts(state: AccStateModel): Account[] {
        const accounts = AccState.accounts(state);
        return accounts.filter(a => state.accounts.includes(a.id));
    }

    @Selector()
    static accountFilters(state: AccStateModel): Filter[] {
        const filters = state.groups.map(g => ({ group: g, accounts: g.accounts.filter(a => state.accounts.includes(a.id)) }))
            .filter(f => f.accounts.length > 0)
            .map(f => ({ name: f.group.fullname, accounts: f.accounts, selected: !f.group.accounts.filter(a => !a.deleted).some(a => !state.accounts.includes(a.id)) }))
            .reduce((acc, f) => {
                if (f.selected) {
                    acc.push({ name: f.name, ids: f.accounts.map(a => a.id) });
                } else {
                    acc = acc.concat(f.accounts.map(a => ({ name: a.fullname, ids: [a.id] })));
                }
                return acc;
            }, [] as Filter[]);
        return filters;
    }

    @Selector()
    static selectedAccount(state: AccStateModel): Account | undefined {
        const accounts = AccState.selectedAccounts(state);
        return accounts.length === 1 ? accounts[0] : undefined;
    }

    @Selector()
    static currencies(state: AccStateModel): string[] {
        return state.groups.reduce((acc, g) => acc.concat(g.accounts), [] as Account[]).filter(a => !a.deleted).map(a => a.currency).filter((v, i, a) => a.indexOf(v) === i);
    }

    ngxsOnInit(ctx: StateContext<AccState>) {
        ctx.dispatch([new GetGroups(), new GetTransactions(), new GetSummary(), new GetCategories()]);
    }

    @Action([AppLoginSuccess, GetGroups], { cancelUncompleted: true })
    async getGroups(cxt: StateContext<AccStateModel>) {
        try {
            const groups = await firstValueFrom(this.api.getGroups(''));
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
                    this.zone.run(() => this.alertService.open('Account created', { status: TuiNotification.Success }).subscribe());
                    const state = cxt.getState();
                    const groups = state.groups.slice();
                    const index = groups.findIndex(g => data.is_owner && !g.is_owner || data.is_coowner && !g.is_coowner);
                    groups.splice(index < 0 ? groups.length : index, 0, data);
                    cxt.patchState({ groups, accounts: data.accounts.map((a: Account) => a.id), transactions: [], transaction_id: null });
                }
            }
        });
    }

    @Action(EditGroup)
    editGroup(cxt: StateContext<AccStateModel>, action: EditGroup) {
        this.dialogService.open(
            new PolymorpheusComponent(AccountDialogComponent, this.injector), { header: `Account #${action.group.id}`, dismissible: false, size: 's', data: action.group }
        ).subscribe({
            next: (data: any) => {
                if (data) {
                    const state = cxt.getState();
                    this.zone.run(() => this.alertService.open('Account updated', { status: TuiNotification.Success }).subscribe());
                    const groups = state.groups.slice().map(g => g.id === data.id ? data as Group : g);
                    let accounts = state.accounts;
                    const groupSelected = !action.group.accounts.some(a => !accounts.includes(a.id));
                    if (groupSelected) {
                        accounts = [...accounts.filter(id => !data.accounts.some((a: Account) => a.id === id)), ...data.accounts.map((a: Account) => a.id)];
                    } else {
                        accounts = accounts.filter(id => !data.accounts.some((a: Account) => a.id === id) || data.accounts.some((a: Account) => a.id === id && !a.deleted));
                    }
                    cxt.patchState({ groups, accounts });
                    cxt.dispatch(new GetTransactions());
                    cxt.dispatch(new GetSummary());
                }
            }
        });
    }

    @Action(DeleteGroup)
    async deleteGroup(cxt: StateContext<AccStateModel>, action: DeleteGroup) {
        try {
            const state = cxt.getState();
            const id = action.id || AccState.selectedGroups(state)[0]?.id;
            if (id) {
                let grp = state.groups.find(g => g.id === id);
                if (!grp) {
                    throw new Error('Account not found');
                }
                const answer = await firstValueFrom(
                    this.dialogService.open(new PolymorpheusComponent(ConfirmationDlgComponent, this.injector), { data: `Are you sure you want to delete account '${grp.fullname}'?`, dismissible: false, size: 's' }),
                    { defaultValue: false }
                );
                if (answer) {
                    await firstValueFrom(this.api.deleteGroup(id));
                    this.zone.run(() => this.alertService.open('Account deleted').subscribe());
                    const groups = state.groups.slice().map(g => g.id !== id ? g : { ...g, deleted: true });
                    const accounts = state.accounts.filter(id => groups.some(g => !g.deleted && g.accounts.some(a => a.id === id)));
                    cxt.patchState({ groups, accounts });
                    cxt.dispatch(new GetTransactions());
                }
            }
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(SelectTransaction)
    selectTransaction(cxt: StateContext<AccStateModel>, action: SelectTransaction) {
        cxt.patchState({ transaction_id: action.id });
    }

    @Action([AppLoginSuccess, GetTransactions], { cancelUncompleted: true })
    async getTransactions(cxt: StateContext<AccStateModel>) {
        try {
            const state = cxt.getState();
            const transactions = await firstValueFrom(this.api.getTransactions(state.accounts, state.search, state.range, state.category?.id, 0, GET_TRANSACTIONS_LIMIT));
            const selected: { [key: number]: boolean } = Object.assign({}, ...state.accounts.map(a => ({ [a]: true })));
            const tv = transactions.map(t => transaction2View(t, selected));
            const transaction_id = tv.find(t => t.id === state.transaction_id)?.id;
            cxt.patchState({ transactions: tv, loaded: false, transaction_id });
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(ScrollTransactions, { cancelUncompleted: true })
    async scrollTransactions(cxt: StateContext<AccStateModel>) {
        try {
            const state = cxt.getState();
            if (!state.loaded) {
                const transactions = await firstValueFrom(this.api.getTransactions(state.accounts, state.search, state.range, state.category?.id, state.transactions.length, GET_TRANSACTIONS_LIMIT));
                const loaded = transactions.length < GET_TRANSACTIONS_LIMIT;
                const selected: { [key: number]: boolean } = Object.assign({}, ...state.accounts.map(a => ({ [a]: true })));
                const tv = state.transactions.concat(transactions.map(t => transaction2View(t, selected)));
                const transaction_id = tv.find(t => t.id === state.transaction_id)?.id;
                cxt.patchState({ transactions: tv, loaded, transaction_id });
            }
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }


    @Action([AppLoginSuccess, GetSummary], { cancelUncompleted: true })
    async getSummary(cxt: StateContext<AccStateModel>) {
        try {
            const state = cxt.getState();
            const summary = await firstValueFrom(this.api.getSummary(state.accounts, state.range));
            const expenses = await firstValueFrom(this.api.getExpenses(state.accounts, state.range));
            cxt.patchState({ summary, expenses });
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(SelectAccounts)
    selectAccounts(cxt: StateContext<AccStateModel>, action: SelectAccounts) {
        cxt.patchState({ accounts: action.accounts });
        cxt.dispatch(new GetTransactions());
        cxt.dispatch(new GetSummary());
    }

    @Action(DeselectAccounts)
    deselectAccounts(cxt: StateContext<AccStateModel>, action: DeselectAccounts) {
        const state = cxt.getState();
        cxt.patchState({ accounts: state.accounts.filter(a => !action.accounts.includes(a)) });
        cxt.dispatch(new GetTransactions());
        cxt.dispatch(new GetSummary());
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
                                this.zone.run(() => this.alertService.open('Transaction updated', { status: TuiNotification.Success }).subscribe());
                                patchStateTransactions(transaction, cxt, true);
                                patchStateTransactions(data, cxt, false);
                                if (!!data.category && cxt.getState().categories.findIndex(c => c.id == data.category.id) < 0) {
                                    cxt.dispatch(new GetCategories());
                                }
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
                    this.zone.run(() => this.alertService.open('Transaction deleted').subscribe());
                    patchStateTransactions(trx, cxt, true);
                }
            }
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(CreateTransaction)
    addTransaction(cxt: StateContext<AccStateModel>, action: CreateTransaction) {
        const state = cxt.getState();
        let account: Account | undefined = state.groups.reduce((acc, g) => (acc || g.accounts.find(a => !a.deleted && (!state.accounts.length || state.accounts.includes(a.id)))), undefined as Account | undefined);
        let recipient: Account | undefined = undefined;
        if (action.type === TransactionType.Transfer) {
            recipient = AccState.accounts(state).find(a => a.id !== account?.id && !a.deleted && a.currency === account?.currency);
        } else if (action.type === TransactionType.Income) {
            recipient = account;
            account = undefined;
        } else if (action.type === TransactionType.Correction) {
            //            recipient = account;
        }
        let transaction: Transaction = {
            type: action.type,
            opdate: moment().format(),
            account: account,
            recipient: recipient,
            category: action.type === TransactionType.Correction ? { id: TransactionType.Correction, name: 'Correction', fullname: 'Correction', level: 0, root_id: null, parent_id: null } : null,
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
                    this.zone.run(() => this.alertService.open('Transaction created', { status: TuiNotification.Success }).subscribe());
                    patchStateTransactions(data, cxt, false);
                    if (!!data.category && cxt.getState().categories.findIndex(c => c.id == data.category.id) < 0) {
                        cxt.dispatch(new GetCategories());
                    }
                }
            }
        });
    }

    @Action(ImportTransactions)
    async importTransactions(cxt: StateContext<AccStateModel>, action: ImportTransactions) {
        try {
            const state = cxt.getState();
            const id = action.id || state.accounts[0];
            const value = await lastValueFrom(this.dialogService.open<{ bank: number, file: File }>(new PolymorpheusComponent(InputFileDlgComponent, this.injector), { dismissible: false }), { defaultValue: null });
            if (!value) {
                return;
            }
            let transactions: TransactionImport[] | null = await lastValueFrom(this.api.importTransactions(id, value.bank, value.file));
            transactions = await lastValueFrom(this.dialogService.open<TransactionImport[]>(new PolymorpheusComponent(ImportDlgComponent, this.injector), { data: transactions, dismissible: false, size: 'l' }), { defaultValue: null });
            if (transactions) {
                await lastValueFrom(this.api.saveTransactions(id, transactions));
                cxt.dispatch(new GetGroups());
                cxt.dispatch(new GetTransactions());
                cxt.dispatch(new GetSummary());
            }
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
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

    @Action(SetSearch, { cancelUncompleted: true })
    setSearch(cxt: StateContext<AccStateModel>, action: SetSearch) {
        cxt.patchState({ search: action.search });
        cxt.dispatch(new GetTransactions());
    }

    @Action(SetCategory, { cancelUncompleted: true })
    setCategory(cxt: StateContext<AccStateModel>, action: SetCategory) {
        cxt.patchState({ category: action.category });
        cxt.dispatch(new GetTransactions());
    }

    @Action(SetRange, { cancelUncompleted: true })
    setRange(cxt: StateContext<AccStateModel>, action: SetRange) {
        cxt.patchState({ range: action.range });
        cxt.dispatch(new GetTransactions());
        cxt.dispatch(new GetSummary());
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
                groups[gindex].accounts = [...groups[gindex].accounts];
                groups[gindex].accounts[aindex] = { ...acc, balance: acc.balance + amount };
            }
        }
    }
}

function transaction2View(t: Transaction, selected: { [key: number]: boolean }): TransactionView {
    const name = t.account && t.recipient ? t.account.fullname + ' => ' + t.recipient.fullname : t.category?.name || "-";
    const account_balance = t.account_balance || t.account?.balance;
    const recipient_balance = t.recipient_balance || t.recipient?.balance;
    const useRecipient = t.recipient && (!account_balance || recipient_balance && selected[t.recipient?.id] && (!t.account || !selected[t.account?.id]));
    const amount = (t.account && !useRecipient) ? { value: t.debit, currency: t.account.currency } : (t.recipient ? { value: t.credit, currency: t.recipient.currency } : { value: t.credit, currency: t.currency });
    const acc = useRecipient ? t.recipient : t.account;
    return { ...t, account_balance, recipient_balance, name, amount, balance: { fullname: acc?.fullname, currency: acc?.currency, balance: useRecipient ? recipient_balance : account_balance } };
}

function patchStateTransactions(transaction: Transaction, cxt: StateContext<AccStateModel>, remove: boolean) {
    const state = cxt.getState();
    const transactions = state.transactions.slice();
    const index = remove ? transactions.findIndex(t => t.id === transaction.id) : Math.max(transactions.findIndex(t => transaction.opdate > t.opdate), 0);
    if (index >= 0) {
        // patch transactions balances
        const selected: { [key: number]: boolean } = Object.assign({}, ...state.accounts.map(a => ({ [a]: true })));
        for (let i = index - 1; i >= 0; i--) {
            let patch = 0;
            const trx = { ...transactions[i] };
            if (trx.account && trx.account?.id === transaction.account?.id || trx.recipient && trx.recipient?.id === transaction.account?.id) {
                patch = -transaction.debit;
            }
            if (trx.account && trx.account?.id === transaction.recipient?.id || trx.recipient && trx.recipient?.id === transaction.recipient?.id) {
                patch = transaction.credit;
            }
            if (remove) {
                patch = -patch;
            }
            if (typeof trx.account_balance === 'number' && (trx.account?.id === transaction.account?.id || trx.account?.id === transaction.recipient?.id)) {
                trx.account_balance += patch;
            }
            if (typeof trx.recipient_balance === 'number' && (trx.recipient?.id === transaction.account?.id || trx.recipient?.id === transaction.recipient?.id)) {
                trx.recipient_balance += patch;
            }
            if (trx.category?.id == TransactionType.Correction) {
                trx.credit += patch;
                if (trx.credit < 0) {
                    trx.credit = -trx.credit;
                    if (trx.recipient) {
                        trx.account = trx.recipient;
                        trx.account_balance = trx.recipient_balance;
                        trx.recipient = undefined;
                        trx.recipient_balance = undefined;
                    } else if (trx.account) {
                        trx.recipient = trx.account;
                        trx.recipient_balance = trx.account_balance;
                        trx.account = undefined;
                        trx.account_balance = undefined;
                    }
                }
                trx.debit = trx.credit;
            }
            transactions[i] = transaction2View(trx, selected);
        }
        if (remove) {
            transactions.splice(index, 1);
        } else {
            transactions.splice(index, 0, transaction2View(transaction, selected));
        }
    }
    // patch group balances
    const groups = state.groups.slice();
    patchGroupBalance(groups, transaction.account, remove ? transaction.debit : -transaction.debit);
    patchGroupBalance(groups, transaction.recipient, remove ? -transaction.credit : transaction.credit);
    const transaction_id = remove && transaction.id === state.transaction_id ? null : (remove ? state.transaction_id : transaction.id);
    cxt.patchState({ transactions, groups, transaction_id });
}

function getAccount(groups: Group[], id: number): Account | undefined {
    return groups.reduce((acc, g) => (acc || g.accounts.find(a => a.id === id)), undefined as Account | undefined);
}
