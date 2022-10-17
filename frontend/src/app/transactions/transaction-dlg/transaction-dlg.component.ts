import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDialogContext, TUI_ICONS_PATH } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { firstValueFrom } from 'rxjs';
import { AccState } from 'src/app/accounts/accounts.state';
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
  transaction = new UntypedFormControl();
  accounts$ = this.store.select(AccState.accounts);

  get type(): TransactionType {
    return this.transaction.value.type;
  }

  get showTransfer(): boolean {
    return this.type == TransactionType.Income || this.type == TransactionType.Expense;
  }

  get showIncome(): boolean {
    return this.type === TransactionType.Transfer && this.transaction.value.category?.root_id === TransactionType.Income;
  }

  get showExpense(): boolean {
    return this.type === TransactionType.Transfer && this.transaction.value.category?.root_id === TransactionType.Expense;
  }

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
      } else if (value.type === TransactionType.Transfer) {
        value.category = null;
      } else if (value.type === TransactionType.Correction) {
        if (value.credit<0) {
          value.recipient = null;
          value.credit = -value.credit;
        } else {
          value.recipient = value.account;
          value.account = null;
        }
        value.debit = value.credit;
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
