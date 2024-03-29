import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ViewSelectSnapshot } from '@ngxs-labs/select-snapshot';
import { Store } from '@ngxs/store';
import { map } from 'rxjs';
import { Account } from '../models/account';
import { Amount, Total } from '../models/balance';
import { Group } from '../models/group';
import { AccState, CreateGroup, SelectAccounts, ToggleGropup } from './accounts.state';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountsComponent {
  groups$ = this.store.select(state => state.acc.groups).pipe(map((groups: Group[]) => groups.filter(g => !g.deleted)));
  expanded$ = this.store.select(state => state.acc.expanded);
  total$ = this.store.select(AccState.total);
  @ViewSelectSnapshot((state: any) => state.acc.accounts) accounts!: number[];

  constructor(private store: Store) { }

  toggle(group: Group): void {
    this.store.dispatch(new ToggleGropup(group.id));
  }

  total(g: Group): Amount[] {
    return Object.values(Total.total(g));
  }

  isAccountSelected(a: Account): boolean {
    return this.accounts.includes(a.id);
  }

  isGroupSelected(group: Group): boolean {
    return !group.accounts.filter(a => !a.deleted).some(a => !this.accounts.includes(a.id));
  }

  isGroupExpandable(group: Group): boolean {
    return group.accounts.filter(a => !a.deleted).length > 1;
  }

  selectGroup(group: Group, event: MouseEvent): void {
    event.stopPropagation();
    let selected = group.accounts.map(a => a.id);
    if (event.ctrlKey) {
      if (this.isGroupSelected(group)) {
        selected = this.accounts.filter(a => !selected.includes(a));
      } else {
        selected = [...this.accounts, ...selected];
      }
    }
    this.store.dispatch(new SelectAccounts(selected));
  }

  selectAccount(account: Account, event: MouseEvent): void {
    event.stopPropagation();
    const accounts = event.ctrlKey ? (this.isAccountSelected(account) ? this.accounts.filter(a => a !== account.id) : [...this.accounts, account.id]) : [account.id];
    this.store.dispatch(new SelectAccounts(accounts));
  }

  newGroup(): void {
    this.store.dispatch(new CreateGroup());
  }
}
