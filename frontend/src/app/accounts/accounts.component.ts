import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ViewSelectSnapshot } from '@ngxs-labs/select-snapshot';
import { Store } from '@ngxs/store';
import { Account } from '../models/account';
import { Amount, Total } from '../models/balance';
import { Group } from '../models/group';
import { AccState, SelectAccounts, ToggleGropup } from './accounts.state';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountsComponent {
  groups$ = this.store.select(state => state.acc.groups);
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
    return !group.accounts.some(a => !this.accounts.includes(a.id));
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
    this.store.dispatch(new SelectAccounts(event.ctrlKey ? (this.isAccountSelected(account) ? this.accounts.filter(a => a !== account.id) : [...this.accounts, account.id]) : [account.id]));
  }
}
