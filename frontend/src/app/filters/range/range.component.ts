import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { TuiHostedDropdownComponent } from '@taiga-ui/core';
import { SetRange } from 'src/app/accounts/accounts.state';
import { DateRange } from 'src/app/models/date-range';

@Component({
  selector: 'app-range',
  templateUrl: './range.component.html',
  styleUrls: ['./range.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RangeComponent {
  @ViewChild(TuiHostedDropdownComponent) component?: TuiHostedDropdownComponent;
  options = [DateRange.all(), DateRange.last30(), DateRange.last90(), DateRange.lastYear(), DateRange.month(), DateRange.year()];
  range$ = this.store.select(state => state.acc.range);
  open = false;

  constructor(private store: Store) { }

  onClick(option: DateRange) {
    this.open = false;
    this.component?.nativeFocusableElement?.focus();
    this.store.dispatch(new SetRange(option));
  }

  prev(option: DateRange) {
    this.store.dispatch(new SetRange(option.prev()));
  }

  next(option: DateRange) {
    this.store.dispatch(new SetRange(option.next()));
  }
}
