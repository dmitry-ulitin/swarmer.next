import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { ScrollTransactions, SelectTransaction } from '../accounts/accounts.state';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsComponent {
  transactions$ = this.store.select(state => state.acc.transactions);
  transactions_id$ = this.store.select(state => state.acc.transaction_id);

  constructor(private store: Store) { }

  selectTransaction(id: number) {
    this.store.dispatch(new SelectTransaction(id));
  }

  onScroll(): void {
    this.store.dispatch(new ScrollTransactions());
  }
}
