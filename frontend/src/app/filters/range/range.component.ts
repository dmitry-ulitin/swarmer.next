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
  options = [DateRange.last30(), DateRange.month(), DateRange.year()];
  value = this.options[0];
  open = false;

  constructor(private store: Store) { }

  onClick(option: DateRange) {
    this.open = false;
    this.component?.nativeFocusableElement?.focus();
    this.value = option;
    this.store.dispatch(new SetRange(this.value));
  }

  itemIsActive(option: DateRange): boolean {
    return option.same(this.value);
  }

  prev() {
    this.value = this.value.prev();
    this.store.dispatch(new SetRange(this.value))
  }
  next() {
    this.value = this.value.next();
    this.store.dispatch(new SetRange(this.value))
  }
}
