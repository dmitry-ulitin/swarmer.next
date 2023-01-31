import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { debounceTime } from 'rxjs';
import { AccState, DeselectAccounts, SetCategory, SetCurrency, SetSearch } from '../accounts/accounts.state';
import { Filter } from '../models/filter';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltersComponent {
  search = new FormControl('');
  filters$ = this.store.select(AccState.accountFilters);
  category$ = this.store.select(state => state.acc.category);
  currency$ = this.store.select(state => state.acc.currency);

  constructor(private store: Store) {
    this.search.valueChanges.pipe(debounceTime(500)).subscribe(value => {
      this.store.dispatch(new SetSearch(value || ''));
    });
  }

  removeFilter(filter: Filter) {
    this.store.dispatch(new DeselectAccounts(filter.ids));
  }

  removeCategory() {
    this.store.dispatch(new SetCategory(null));
  }

  removeCurrency() {
    this.store.dispatch(new SetCurrency(null));
  }
}
