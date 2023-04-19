import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ViewSelectSnapshot } from '@ngxs-labs/select-snapshot';
import { Select, Store } from '@ngxs/store';
import { tuiSvgOptionsProvider } from '@taiga-ui/core';
import { Observable } from 'rxjs';
import { AccState, CreateTransaction, CreateGroup, DeleteGroup, DeleteTransaction, EditGroup, EditTransaction, GetGroups, GetTransactions, ImportTransactions, GetSummary, ShowCategories, SaveBackup, LoadBackup } from '../accounts/accounts.state';
import { AppLogout, AppState } from '../app.state';
import { Account } from '../models/account';
import { Group } from '../models/group';
import { TransactionType } from '../models/transaction';

const MAPPER: Record<string, string> = {
  tuiIconMinimize: 'swap_horiz_24'
};

export function iconsPath(name: string): string {
  return MAPPER[name] ? `assets/icons/${MAPPER[name]}.svg#${MAPPER[name]}` : `assets/taiga-ui/icons/${name}.svg#${name}`;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    tuiSvgOptionsProvider({
      path: iconsPath,
    })
  ]
})
export class HeaderComponent {
  @Select(AppState.isAuthenticated) isAuthenticated$!: Observable<boolean>;
  @Select(AppState.claims) claims$!: Observable<any>;
  @ViewSelectSnapshot(AccState.selectedGroup) group!: Group | undefined;
  @ViewSelectSnapshot(AccState.accounts) accounts!: Account[];
  account$ = this.store.select(AccState.selectedAccount);
  transactions_id$ = this.store.select(state => state.acc.transaction_id);
  open = false;

  constructor(private store: Store) { }

  logout(): void {
    this.store.dispatch(new AppLogout());
  }

  onRefresh(): void {
    this.store.dispatch(new GetGroups());
    this.store.dispatch(new GetTransactions());
    this.store.dispatch(new GetSummary());
  }

  newGroup(): void {
    this.store.dispatch(new CreateGroup());
  }

  editGroup(group: Group): void {
    this.store.dispatch(new EditGroup(group));
  }

  deleteGroup(group: Group): void {
    this.store.dispatch(new DeleteGroup(group.id));
  }

  onExpense(): void {
    this.store.dispatch(new CreateTransaction(TransactionType.Expense));
  }

  onTransfer(): void {
    this.store.dispatch(new CreateTransaction(TransactionType.Transfer));
  }

  onIncome(): void {
    this.store.dispatch(new CreateTransaction(TransactionType.Income));
  }

  editTransaction(): void {
    this.store.dispatch(new EditTransaction());
  }

  deleteTransaction(): void {
    this.store.dispatch(new DeleteTransaction());
  }

  onCorrection(account: Account): void {
    this.store.dispatch(new CreateTransaction(TransactionType.Correction));
  }

  onImport(account: Account): void {
    this.store.dispatch(new ImportTransactions(account.id));
  }

  onCategories(): void {
    this.store.dispatch(new ShowCategories());
  }

  onSaveBackup(): void {
    this.open = false;
    this.store.dispatch(new SaveBackup());
  }

  onLoadBackup(): void {
    this.open = false;
    this.store.dispatch(new LoadBackup());
  }
}
