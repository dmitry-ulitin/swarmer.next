import { Component, ChangeDetectionStrategy, Inject, OnInit, Injector } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDialogContext, TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { lastValueFrom, map, merge } from 'rxjs';
import { Category } from '../models/category';
import { Rule } from '../models/rule';
import { TransactionImport, TransactionType } from '../models/transaction';
import { ApiService } from '../services/api.service';
import { RuleDlgComponent } from './rule-dlg/rule-dlg.component';

@Component({
  templateUrl: './import-dlg.component.html',
  styleUrls: ['./import-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportDlgComponent implements OnInit {
  readonly columns = ['selected', 'date', 'amount', 'category', 'rule', 'party', 'details'];
  data: TransactionImport[] = [];
  rules: Rule[] = [];
  categories$ = this.store.select(state => state.acc.categories);
  readonly matcher = (category: Category, type: TransactionType): boolean => category.level > 0 && category.root_id == type;

  categories!: UntypedFormArray;
  category(index: number) {
    return this.categories.at(index) as UntypedFormControl;
  }

  constructor(private store: Store, private api: ApiService, @Inject(TuiDialogService) private readonly dialogService: TuiDialogService, @Inject(Injector) private readonly injector: Injector,
    @Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<TransactionImport[] | null, TransactionImport[]>) {
    this.data = this.context.data;
    this.categories = new UntypedFormArray(this.data.map(t => new UntypedFormControl(t.category)));
    merge(...this.categories.controls.map((control: AbstractControl, index: number) =>
      control.valueChanges.pipe(map(value => ({ rowIndex: index, data: value })))
    )).subscribe(changes => {
      if (this.data[changes.rowIndex].party) {
        this.categories.controls
          .filter((control: AbstractControl, index: number) => !control.value && this.data[index].type === this.data[changes.rowIndex].type && this.data[index].party === this.data[changes.rowIndex].party)
          .forEach(control => control.setValue(changes.data, { emitEvent: false }));
      }
    });
  }

  async ngOnInit() {
    this.rules = await lastValueFrom(this.api.getRules());
  }

  async onRule(index: number) {
    const rule = await lastValueFrom(this.dialogService.open<Rule>(new PolymorpheusComponent(RuleDlgComponent, this.injector), { data: { rule: this.data[index].rule, transaction: this.data[index] }, dismissible: false }));
  }

  onCheck(event: any, index: number) {
    this.data[index].selected = event.target?.checked;
  }

  onNext() {
    this.data.forEach((t, index) => t.category = this.category(index).value);
    this.context.completeWith(this.data);
  }

  onCancel() {
    this.context.completeWith(null);
  }
}
