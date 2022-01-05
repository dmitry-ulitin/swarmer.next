import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ViewSelectSnapshot } from '@ngxs-labs/select-snapshot';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AccState, CreateGroup, EditGroup, EditTransaction, GetGroups, GetTransactions } from '../accounts/accounts.state';
import { AppLogout, AppState } from '../app.state';
import { Group } from '../models/group';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  onIncome(): void { 
    this.store.dispatch(new EditTransaction({} as any));
  }
}
