import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { AccState } from '../accounts/accounts.state';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent {
  transactions$ = this.store.select(state => state.acc.transactions);;

  constructor(private store: Store) { }
}
