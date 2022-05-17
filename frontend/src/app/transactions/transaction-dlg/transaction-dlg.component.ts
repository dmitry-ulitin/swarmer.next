import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDialogContext, TUI_ICONS_PATH } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { firstValueFrom } from 'rxjs';
import { AppPrintError } from 'src/app/app.state';
import { Transaction, TransactionType } from 'src/app/models/transaction';
import { ApiService } from 'src/app/services/api.service';

const MAPPER: Record<string, string> = {
  tuiIconCollapse: 'swap_horiz_24'
};

export function iconsPath(name: string): string {
  return MAPPER[name] ? `assets/icons/${MAPPER[name]}.svg#${MAPPER[name]}` : `assets/taiga-ui/icons/${name}.svg#${name}`;
}

@Component({
  templateUrl: './transaction-dlg.component.html',
  styleUrls: ['./transaction-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TUI_ICONS_PATH,
      useValue: iconsPath,
    },
  ]
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
      const value = this.transaction.value;
      if (value.type === TransactionType.Expense) {
        value.recipient = null;
      } else if (value.type === TransactionType.Income) {
        value.account = null;
      } else {
        value.category = null;
      }
      const transaction = await firstValueFrom(this.api.saveTransaction(value));
      this.context.completeWith(transaction);
    } catch (err) {
      this.store.dispatch(new AppPrintError(err));
    }
  }

  onTransfer() {
    this.transaction.setValue({
      ...this.transaction.value,
      type: TransactionType.Transfer
    });
  }

  onIncome() {
    this.transaction.setValue({
      ...this.transaction.value,
      type: TransactionType.Income
    });
  }

  onExpense() {
    this.transaction.setValue({
      ...this.transaction.value,
      type: TransactionType.Expense
    });
  }

  onCancel() {
    this.context.completeWith(undefined);
  }
}
