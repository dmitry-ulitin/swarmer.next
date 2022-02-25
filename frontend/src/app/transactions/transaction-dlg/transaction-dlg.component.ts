import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TuiDialogContext, TuiDialogService } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { Transaction } from 'src/app/models/transaction';

@Component({
  templateUrl: './transaction-dlg.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionDlgComponent {
  transaction = new FormControl();

  constructor(
    @Inject(TuiDialogService) private readonly dialogService: TuiDialogService,
    @Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<Transaction, Transaction>
  ) {
    this.transaction.setValue(this.context.data);
  }
}
