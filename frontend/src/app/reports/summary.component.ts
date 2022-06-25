import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryComponent {
  summary$ = this.store.select(state => state.acc.summary);

  constructor(private store: Store) { }
}
