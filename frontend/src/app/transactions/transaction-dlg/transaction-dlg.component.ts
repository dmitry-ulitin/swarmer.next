import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDialogContext, TuiDialogService } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { AccState } from 'src/app/accounts/accounts.state';
import { Transaction } from 'src/app/models/transaction';

@Component({
  selector: 'app-transaction-dlg',
  templateUrl: './transaction-dlg.component.html',
  styleUrls: ['./transaction-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionDlgComponent {
  accounts$ = this.store.select(AccState.accounts);
  currencies = this.store.selectSnapshot(AccState.currencies);

  form = new FormGroup({
    'id': new FormControl(),
    'opdate': new FormControl(),
    'account': new FormControl(),
    'credit': new FormControl(),
    'recipient': new FormControl(),
    'debit': new FormControl(),
    'category': new FormControl(),
    'currency': new FormControl(),
    'details': new FormControl('')
  });

  constructor(
    private store: Store,
    @Inject(TuiDialogService) private readonly dialogService: TuiDialogService,
    @Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<Transaction, Transaction>
  ) {
  }

}
