import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { AbstractControl, FormArray, FormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { map, merge } from 'rxjs';
import { Category } from '../models/category';
import { TransactionImport, TransactionType } from '../models/transaction';

@Component({
  templateUrl: './import-dlg.component.html',
  styleUrls: ['./import-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportDlgComponent {
  readonly columns = ['selected', 'date', 'amount', 'category', 'party', 'details'];
  data: TransactionImport[] = [];
  categories$ = this.store.select(state => state.acc.categories);
  readonly matcher = (category: Category, type: TransactionType): boolean => category.root_id == type;

  categories!: FormArray;
  category(index: number) {
    return this.categories.at(index) as FormControl;
  }

  constructor(private store: Store, @Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<TransactionImport[] | null, TransactionImport[]>) {
    this.data = this.context.data;
    this.categories = new FormArray(this.data.map(t => new FormControl(t.category)));
    merge(...this.categories.controls.map((control: AbstractControl, index: number) =>
      control.valueChanges.pipe(map(value => ({ rowIndex: index, data: value })))
    )).subscribe(changes => {
      this.categories.controls.filter((control: AbstractControl, index: number) => this.data[index].party === this.data[changes.rowIndex].party).forEach(control => control.setValue(changes.data, { emitEvent: false }));
    });
  }

  onNext() {
    this.data.forEach((t, index) => t.category = this.category(index).value);
    this.context.completeWith(this.data);
  }

  onCancel() {
    this.context.completeWith(null);
  }
}