import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { map } from 'rxjs';
import { SetCategory, SetCurrency } from '../accounts/accounts.state';
import { Summary } from '../models/summary';
import { TransactionType } from '../models/transaction';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryComponent {
  summary$ = this.store.select(state => state.acc.summary);
  expenses$ = this.store.select(state => state.acc.summary).pipe(map(summary => summary.filter((s: Summary) => s.debit)));
  income$ = this.store.select(state => state.acc.summary).pipe(map(summary => summary.filter((s: Summary) => s.credit)));
  transfers$ = this.store.select(state => state.acc.summary).pipe(map(summary => summary.filter((s: Summary) => (s.transfers_credit-s.transfers_debit))));

  constructor(private store: Store) { }

  onCurrency(currency: string) {
    this.store.dispatch(new SetCurrency(currency));
  }

  onExpenses() {
    this.store.dispatch(new SetCategory({id: TransactionType.Expense, name: "Expenses", fullname: "Expenses", level: 0, type: TransactionType.Expense, parent_id: null}));
  }

  onIncome() {
    this.store.dispatch(new SetCategory({id: TransactionType.Income, name: "Income", fullname: "Income", level: 0, type: TransactionType.Income, parent_id: null}));
  }

  onTransfers() {
    this.store.dispatch(new SetCategory({id: TransactionType.Transfer, name: "Transfers", fullname: "Transfers", level: 0, type: TransactionType.Transfer, parent_id: null}));
  }
}
