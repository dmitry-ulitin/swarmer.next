import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { firstValueFrom } from 'rxjs';
import { AppPrintError } from 'src/app/app.state';
import { Transaction } from 'src/app/models/transaction';
import { ApiService } from 'src/app/services/api.service';

@Component({
  templateUrl: './transaction-dlg.component.html',
  styleUrls: ['./transaction-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionDlgComponent {
  transaction = new FormControl();

  constructor(
    private api: ApiService,
    private store: Store,
    @Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<Transaction | undefined, Transaction>
  ) {
    this.transaction.setValue(this.context.data);
  }

  async onSubmit() {
    try {
       const transaction = await firstValueFrom(this.api.saveTransaction(this.transaction.value));      
       this.context.completeWith(transaction);
    } catch (err) {
       this.store.dispatch(new AppPrintError(err));
    }
  }

  onCancel() {
    this.context.completeWith(undefined);
  }
}
