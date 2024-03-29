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
import { firstValueFrom, forkJoin, lastValueFrom } from 'rxjs';
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
import { CategoriesComponent } from '../categories/categories.component';
import { CategoryDlgComponent } from '../categories/category-dlg/category-dlg.component';
import { LoadDumpDlgComponent } from '../import/load-dump-dlg.component';

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

export class GetCategoriesSummary {
    static readonly type = '[Acc] Get Categories Summary';
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

export class ShowCategories {
    static readonly type = '[Acc] Show Categories';
}

export class GetCategories {
    static readonly type = '[Acc] Get Categories';
}

export class CreateCategory {
    static readonly type = '[Acc] Create Category';
    constructor(public id: number) { }
}

export class EditCategory {
    static readonly type = '[Acc] Edit Category';
    constructor(public id: number) { }
}

export class DeleteCategory {
    static readonly type = '[Acc] Delete Category';
    constructor(public id?: number, public replace: number | null = null) { }
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

export class SetCurrency {
    static readonly type = '[Acc] Set Currency';
    constructor(public currency: string | null) { }
}

export class SaveBackup {
    static readonly type = '[Acc] Save Backup';
}

export class LoadBackup {
    static readonly type = '[Acc] Load Backup';
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
    income: CategorySum[];
    expenses: CategorySum[];
    // filters
    search: string;
    range: DateRange;
    category: Category | null;
    currency: string | null;

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
        income: [],
        expenses: [],
        search: '',
        range: DateRange.last30(),
        category: null,
        currency: null,
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

    @Selector()
    static summaryCurrencies(state: AccStateModel): string[] {
        return state.summary.filter(s => !!s.credit || !!s.debit || !!s.transfers_credit || !!s.transfers_debit).map(s => s.currency).filter((v, i, a) => a.indexOf(v) === i);
    }

    ngxsOnInit(ctx: StateContext<AccState>) {
        ctx.dispatch(new AppLoginSuccess());
    }

    @Action([AppLoginSuccess, GetGroups], { cancelUncompleted: true })
    async getGroups(cxt: StateContext<AccStateModel>, action: AppLoginSuccess | GetGroups) {
        try {
            const groups = await firstValueFrom(this.api.getGroups(''));
            cxt.patchState({ groups });
            if (action instanceof AppLoginSuccess) {
                let max = groups.map(g => g.opdate || '').reduce((max,c) => c > max? c : max);
                if (max < (cxt.getState().range.from?.toString('YMD','-') || '')) {
                    cxt.dispatch(new SetRange(DateRange.all()));
                }
            }
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
                    cxt.dispatch(new GetCategories());
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
                    cxt.dispatch(new GetCategories());
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
                    cxt.dispatch(new GetCategories());
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
            const transactions = await firstValueFrom(this.api.getTransactions(state.accounts, state.search, state.range, state.category?.id, state.currency, 0, GET_TRANSACTIONS_LIMIT));
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
                const transactions = await firstValueFrom(this.api.getTransactions(state.accounts, state.search, state.range, state.category?.id, state.currency, state.transactions.length, GET_TRANSACTIONS_LIMIT));
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
            cxt.patchState({ summary });
            if (!!state.currency) {
                const currencies = summary.filter(s => !!s.credit || !!s.debit || !!s.transfers_credit || !!s.transfers_debit).map(s => s.currency).filter((v, i, a) => a.indexOf(v) === i);
                if (!currencies.includes(state.currency)) {
                    cxt.patchState({ currency: null });
                    cxt.dispatch(new GetTransactions());
                }
            }
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action([AppLoginSuccess, GetCategoriesSummary, GetSummary], { cancelUncompleted: true })
    async getExpenses(cxt: StateContext<AccStateModel>) {
        try {
            const state = cxt.getState();
            const { income, expenses } = await firstValueFrom(
                forkJoin({
                    income: this.api.getCategoriesSummary(TransactionType.Income, state.accounts, state.range),
                    expenses: this.api.getCategoriesSummary(TransactionType.Expense, state.accounts, state.range)
                })
            );
            cxt.patchState({ expenses, income });
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(SelectAccounts)
    selectAccounts(cxt: StateContext<AccStateModel>, action: SelectAccounts) {
        cxt.patchState({ accounts: action.accounts });
        const state = cxt.getState();
        if (!!state.currency) {
            const currencies = AccState.selectedAccounts(state).map(a => a.currency);
            if (!currencies.includes(state.currency)) {
                cxt.patchState({ currency: null });
            }
        }
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
            const state = cxt.getState();
            const transaction_id = action.id || state.transaction_id;
            if (transaction_id) {
                const transaction = await firstValueFrom(this.api.getTransaction(transaction_id));
                this.zone.run(async () => {
                    const data = await firstValueFrom(this.dialogService.open<Transaction | undefined>(
                        new PolymorpheusComponent(TransactionDlgComponent, this.injector), { data: transaction, dismissible: false, size: 's' }),
                        { defaultValue: undefined }
                    );
                    if (data) {
                        this.zone.run(() => this.alertService.open('Transaction updated', { status: TuiNotification.Success }).subscribe());
                        patchStateTransactions(transaction, cxt, true);
                        patchStateTransactions(data, cxt, false);
                        if (!!data.category && state.categories.findIndex(c => c.id === data.category?.id) < 0) {
                            cxt.dispatch(new GetCategories());
                        }
                        cxt.dispatch(new GetCategoriesSummary());
                    }
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
                    cxt.dispatch(new GetCategoriesSummary());
                }
            }
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(CreateTransaction)
    async addTransaction(cxt: StateContext<AccStateModel>, action: CreateTransaction) {
        const state = cxt.getState();
        let accounts = AccState.accounts(state);
        const first = state.transactions.find((t: TransactionView) => t.type !== TransactionType.Transfer);
        let account: Account | null | undefined = first?.account || first?.recipient
            || accounts.find(a => a.id === state.accounts[0]) || accounts[0];
        let recipient: Account | null | undefined = undefined;
        if (action.type === TransactionType.Transfer) {
            const transfer = state.transactions.find((t: TransactionView) => t.type === TransactionType.Transfer);
            account = transfer?.account || account;
            recipient = transfer?.recipient ?? accounts.find(a => a.id !== account?.id && !a.deleted && a.currency === account?.currency);
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
            category: action.type === TransactionType.Correction ? { id: TransactionType.Correction, name: 'Correction', fullname: 'Correction', level: 0, type: TransactionType.Correction, parent_id: null } : null,
            currency: account?.currency || recipient?.currency || 'EUR',
            debit: 0,
            credit: 0,
            details: ''
        };
        const data = await firstValueFrom(this.dialogService.open<Transaction | undefined>(
            new PolymorpheusComponent(TransactionDlgComponent, this.injector), { data: transaction, dismissible: false, size: 's' }
        ));
        if (data) {
            this.zone.run(() => this.alertService.open('Transaction created', { status: TuiNotification.Success }).subscribe());
            patchStateTransactions(data, cxt, false);
            if (state.categories.findIndex(c => c.id === data.category?.id) < 0) {
                cxt.dispatch(new GetCategories());
            }
            cxt.dispatch(new GetCategoriesSummary());
        }
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
            this.zone.run(async () => {
                transactions = await lastValueFrom(this.dialogService.open<TransactionImport[]>(new PolymorpheusComponent(ImportDlgComponent, this.injector), { data: transactions, dismissible: false, size: 'l' }), { defaultValue: null });
                if (transactions) {
                    await lastValueFrom(this.api.saveTransactions(id, transactions));
                    cxt.dispatch(new GetGroups());
                    cxt.dispatch(new GetTransactions());
                    cxt.dispatch(new GetSummary());
                }
            });
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

    @Action(SetCurrency, { cancelUncompleted: true })
    setCurrency(cxt: StateContext<AccStateModel>, action: SetCurrency) {
        cxt.patchState({ currency: action.currency });
        cxt.dispatch(new GetTransactions());
    }

    @Action(ShowCategories)
    async showCategories(cxt: StateContext<AccStateModel>) {
        await firstValueFrom(this.dialogService.open(
            new PolymorpheusComponent(CategoriesComponent, this.injector), { header: "Categories", size: 'l' }), { defaultValue: null }
        );
    }

    @Action(EditCategory)
    async editCategory(cxt: StateContext<AccStateModel>, action: EditCategory) {
        try {
            const category = cxt.getState().categories.find((c: Category) => c.id === action.id);
            const data = await firstValueFrom(this.dialogService.open<Category | undefined>(
                new PolymorpheusComponent(CategoryDlgComponent, this.injector), { header: "Edit Category", data: category, dismissible: false, size: 's' }
            ), { defaultValue: null });
            if (data) {
                await lastValueFrom(this.api.saveCategory(data));
                this.zone.run(() => this.alertService.open('Category updated', { status: TuiNotification.Success }).subscribe());
                cxt.dispatch(new GetCategories());
                cxt.dispatch(new GetTransactions());
                cxt.dispatch(new GetCategoriesSummary());
            }
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(CreateCategory)
    async createCategory(cxt: StateContext<AccStateModel>, action: CreateCategory) {
        try {
            const parent = cxt.getState().categories.find((c: Category) => c.id === action.id) || cxt.getState().categories[0];
            const category: Category = { id: null, name: '', fullname: '', level: parent.level + 1, type: parent.type, parent_id: parent.id }
            const data = await firstValueFrom(this.dialogService.open<Category | undefined>(
                new PolymorpheusComponent(CategoryDlgComponent, this.injector), { header: "Create Category", data: category, dismissible: false, size: 's' }
            ), { defaultValue: null });
            if (data) {
                await lastValueFrom(this.api.saveCategory(data));
                this.zone.run(() => this.alertService.open('Category created', { status: TuiNotification.Success }).subscribe());
                cxt.dispatch(new GetCategories());
            }
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(DeleteCategory)
    async deleteCategory(cxt: StateContext<AccStateModel>, action: DeleteCategory) {
        try {
            const state = cxt.getState();
            if (action.id) {
                const answer = await firstValueFrom(
                    this.dialogService.open(new PolymorpheusComponent(ConfirmationDlgComponent, this.injector), { data: 'Are you sure you want to delete this category?', dismissible: false, size: 's' }),
                    { defaultValue: false }
                );
                if (answer) {
                    await firstValueFrom(this.api.deleteCategory(action.id));
                    this.zone.run(() => this.alertService.open('Category deleted').subscribe());
                    cxt.dispatch(new GetCategories());
                    cxt.dispatch(new GetTransactions());
                    cxt.dispatch(new GetCategoriesSummary());
                }
            }
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action([SaveBackup], { cancelUncompleted: true })
    async backup(cxt: StateContext<AccStateModel>) {
        try {
            const data = await firstValueFrom(this.api.getBackup());
            const url = window.URL.createObjectURL(data.body as Blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `export_${new Date().toISOString().substring(0, 16)}.json`;
            link.click();
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(LoadBackup)
    async loadBackup(cxt: StateContext<AccStateModel>) {
        try {
            const state = cxt.getState();
            const value = await lastValueFrom(this.dialogService.open<File>(new PolymorpheusComponent(LoadDumpDlgComponent, this.injector), { dismissible: false }), { defaultValue: null });
            if (!value) {
                return;
            }
            await lastValueFrom(this.api.loadBackup(value));
            this.zone.run(() => this.alertService.open('Backup Loaded').subscribe());
            cxt.dispatch(new AppLoginSuccess());
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
                groups[gindex].accounts = [...groups[gindex].accounts];
                groups[gindex].accounts[aindex] = { ...acc, balance: acc.balance + amount };
            }
        }
    }
}

function transaction2View(t: Transaction, selected: { [key: number]: boolean }): TransactionView {
    const name = t.account && t.recipient ? t.account.fullname + ' => ' + t.recipient.fullname : t.category?.name || "-";
    const useRecipient = t.recipient && (typeof t.account?.balance !== 'number' || typeof t.recipient?.balance === 'number' && selected[t.recipient?.id] && (!t.account || !selected[t.account?.id]));
    const amount = (t.account && !useRecipient) ? { value: t.debit, currency: t.account.currency } : (t.recipient ? { value: t.credit, currency: t.recipient.currency } : { value: t.credit, currency: t.currency });
    const acc = useRecipient ? t.recipient : t.account;
    return { ...t, name, amount, balance: { fullname: acc?.fullname, currency: acc?.currency, balance: acc?.balance } };
}

function patchStateTransactions(transaction: Transaction, cxt: StateContext<AccStateModel>, remove: boolean) {
    const state = cxt.getState();
    const transactions = state.transactions.slice();
    const index = remove ? transactions.findIndex(t => t.id === transaction.id) : Math.max(transactions.findIndex(t => transaction.opdate == t.opdate && (transaction.id || 0) > (t.id || 0) || transaction.opdate > t.opdate), 0);
    if (index >= 0) {
        // patch transactions balances
        const selected: { [key: number]: boolean } = Object.assign({}, ...state.accounts.map(a => ({ [a]: true })));
        for (let i = index - 1; i >= 0; i--) {
            let apatch = 0;
            let rpatch = 0;
            const trx = { ...transactions[i] };
            if (trx.account && trx.account?.id === transaction.account?.id) {
                apatch = -transaction.debit;
            }
            if (trx.recipient && trx.recipient?.id === transaction.account?.id) {
                rpatch = -transaction.debit;
            }
            if (trx.account && trx.account?.id === transaction.recipient?.id) {
                apatch = transaction.credit;
            }
            if (trx.recipient && trx.recipient?.id === transaction.recipient?.id) {
                rpatch = transaction.credit;
            }
            if (remove) {
                apatch = -apatch;
                rpatch = -rpatch;
            }
            if (!!trx.account && typeof trx.account.balance === 'number' && (trx.account?.id === transaction.account?.id || trx.account?.id === transaction.recipient?.id)) {
                trx.account.balance += apatch;
            }
            if (!!trx.recipient && typeof trx.recipient.balance === 'number' && (trx.recipient?.id === transaction.account?.id || trx.recipient?.id === transaction.recipient?.id)) {
                trx.recipient.balance += rpatch;
            }
            if (trx.category?.id == TransactionType.Correction) {
                trx.credit += rpatch;
                if (trx.credit < 0) {
                    trx.credit = -trx.credit;
                    if (trx.recipient) {
                        trx.account = trx.recipient;
                        trx.recipient = undefined;
                    } else if (trx.account) {
                        trx.recipient = trx.account;
                        trx.account = undefined;
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
    // patch summary
    const summary = state.summary.slice();
    for (let s of summary) {
        if (!!transaction.account?.id) {
            if (!!transaction.recipient?.id) {
                if (transaction.account.currency === s.currency && state.accounts.includes(transaction.account.id) && !state.accounts.includes(transaction.recipient.id)) {
                    s.transfers_debit += remove ? -transaction.debit : transaction.debit;
                } else if (transaction.recipient.currency === s.currency && !state.accounts.includes(transaction.account.id) && state.accounts.includes(transaction.recipient.id)) {
                    s.transfers_credit += remove ? -transaction.credit : transaction.credit;
                }
            } else if (transaction.account.currency === s.currency) {
                s.debit += remove ? -transaction.debit : transaction.debit;
            }
        } else if (!!transaction.recipient?.id && transaction.recipient.currency === s.currency) {
            s.credit += remove ? -transaction.credit : transaction.credit;
        }
    }
    // patch state
    cxt.patchState({ transactions, groups, transaction_id, summary });
}

function getAccount(groups: Group[], id: number): Account | undefined {
    return groups.reduce((acc, g) => (acc || g.accounts.find(a => a.id === id)), undefined as Account | undefined);
}
