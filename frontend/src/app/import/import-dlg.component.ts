import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { Transaction } from '../models/transaction';

interface TransactionSelection extends Transaction {
  selected: boolean;
}

@Component({
  templateUrl: './import-dlg.component.html',
  styleUrls: ['./import-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportDlgComponent {
  readonly columns = ['selected', 'date', 'amount', 'category', 'party', 'details'];
  data: TransactionSelection[] = [];

  constructor(@Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<Transaction[] | null, Transaction[]>) {
    this.data = this.context.data.map(t => ({...t, selected: !t.id}));
  }

  onNext() {
    this.context.completeWith(this.data);
  }

  onCancel() {
    this.context.completeWith(null);
  }
}
