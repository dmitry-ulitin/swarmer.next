import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { debounceTime } from 'rxjs';
import { AccState, DeselectAccounts, SetSearch } from '../accounts/accounts.state';
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

  constructor(private store: Store) {
    this.search.valueChanges.pipe(debounceTime(500)).subscribe(value => {
      this.store.dispatch(new SetSearch(value || ''));
    });
  }

  removeFilter(filter: Filter) {
    this.store.dispatch(new DeselectAccounts(filter.ids));
  }
}
