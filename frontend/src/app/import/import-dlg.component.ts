import { Component, ChangeDetectionStrategy, Inject, OnInit, Injector } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDialogContext, TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { lastValueFrom, map, merge } from 'rxjs';
import { AppPrintError } from '../app.state';
import { Category } from '../models/category';
import { ConditionType, Rule } from '../models/rule';
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
  readonly matcher = (category: Category, type: TransactionType): boolean => category.level > 0 && category.type == type;

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
    try {
      let rule = await lastValueFrom(this.dialogService.open<Rule>(new PolymorpheusComponent(RuleDlgComponent, this.injector), { data: { rule: this.data[index].rule, transaction: this.data[index] }, dismissible: false }), { defaultValue: null });
      if (rule) {
        //        rule = await lastValueFrom(this.api.saveRule(rule));
        this.data[index].rule = rule;
        this.data[index].category = rule.category;
        this.categories.controls[index].setValue(rule.category);
        this.categories.controls
          .filter((control: AbstractControl, i: number) => {
            if (!control.value) {
              const data = this.data[i];
              return !!data.party &&
                (rule?.conditionType == ConditionType.PARTY_EQUALS && data.party == rule?.conditionValue || rule?.conditionType == ConditionType.PARTY_CONTAINS && data.party?.includes(rule?.conditionValue || ''))
                || !!data.details &&
                (rule?.conditionType == ConditionType.DETAILS_EQUALS && data.details == rule?.conditionValue || rule?.conditionType == ConditionType.DETAILS_CONTAINS && data.details?.includes(rule?.conditionValue || ''));
            }
            return false;
          })
          .forEach(control => control.setValue(rule?.category, { emitEvent: false }));
      }
    } catch (err) {
      this.store.dispatch(new AppPrintError(err));
    }
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
