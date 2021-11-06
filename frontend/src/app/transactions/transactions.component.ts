import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsComponent {
  transactions$ = this.store.select(state => state.acc.transactions);;

  constructor(private store: Store) { }
}
