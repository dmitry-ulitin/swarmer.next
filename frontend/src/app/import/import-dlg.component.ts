import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { Transaction } from '../models/transaction';

@Component({
  templateUrl: './import-dlg.component.html',
  styleUrls: ['./import-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportDlgComponent {
  readonly columns = ['date', 'amount', 'category', 'party', 'details'];
  data: Transaction[] = [];

  constructor(@Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<Transaction[] | null, Transaction[]>) {
    this.data = this.context.data;
  }

  onNext() {
    this.context.completeWith(this.data);
  }

  onCancel() {
    this.context.completeWith(null);
  }
}
