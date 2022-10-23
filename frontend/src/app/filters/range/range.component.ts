import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { SetRange } from 'src/app/accounts/accounts.state';
import { DateRange } from 'src/app/models/date-range';

@Component({
  selector: 'app-range',
  templateUrl: './range.component.html',
  styleUrls: ['./range.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RangeComponent {

  options = [DateRange.last30(), DateRange.month(), DateRange.year()];
  value = this.options[0];
  open = false;

  constructor(private store: Store) { }

  onClick(option: DateRange) {
    this.open = false;
    this.value = option;
    this.store.dispatch(new SetRange(option))
  }

  itemIsActive(option: DateRange): boolean {
    return option.same(this.value);
  }
}
