import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ViewSelectSnapshot } from '@ngxs-labs/select-snapshot';
import { Select, Store } from '@ngxs/store';
import { TUI_ICONS_PATH } from '@taiga-ui/core';
import { Observable } from 'rxjs';
import { AccState, AddTransaction, CreateGroup, EditGroup, EditTransaction, GetGroups, GetTransactions } from '../accounts/accounts.state';
import { AppLogout, AppState } from '../app.state';
import { Group } from '../models/group';
import { TransactionType } from '../models/transaction';

const MAPPER: Record<string, string> = {
  tuiIconCollapse: 'swap_horiz_24'
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
    {
      provide: TUI_ICONS_PATH,
      useValue: iconsPath,
    },
  ]
})
export class HeaderComponent {
  @Select(AppState.isAuthenticated) isAuthenticated$!: Observable<boolean>;
  @Select(AppState.claims) claims$!: Observable<any>;
  @ViewSelectSnapshot(AccState.selectedGroups) groups!: Group[];

  get group(): Group | undefined {
    return this.groups.length === 1 ? this.groups[0] : undefined;
  }

  constructor(private store: Store) { }

  logout(): void {
    this.store.dispatch(new AppLogout());
  }

  onRefresh(): void {
    this.store.dispatch(new GetGroups());
    this.store.dispatch(new GetTransactions());
  }

  newGroup(): void {
    this.store.dispatch(new CreateGroup());
  }

  editGroup(group: Group): void {
    this.store.dispatch(new EditGroup(group));
  }

  removeGroup(): void { }

  onExpense(): void {
    this.store.dispatch(new AddTransaction(TransactionType.Expense));
  }

  onTransfer(): void {
    this.store.dispatch(new AddTransaction(TransactionType.Transfer));
  }

  onIncome(): void {
    this.store.dispatch(new AddTransaction(TransactionType.Income));
  }
}
