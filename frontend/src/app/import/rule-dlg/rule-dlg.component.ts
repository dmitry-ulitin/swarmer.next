import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { takeUntil } from 'rxjs';
import { Category } from 'src/app/models/category';
import { Rule } from 'src/app/models/rule';
import { Transaction, TransactionType } from 'src/app/models/transaction';

@Component({
  selector: 'app-rule-dlg',
  templateUrl: './rule-dlg.component.html',
  styleUrls: ['./rule-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TuiDestroyService]
})
export class RuleDlgComponent {
  transaction: Partial<Transaction> = { type: TransactionType.Expense };
  categories$ = this.store.select(state => state.acc.categories);
  readonly filter = (category: Category): boolean => category.level > 0 && category.type == this.transaction.type;
  readonly matcher = (c1: Category, c2: Category): boolean => c1.id === c2.id;
  fields = [{ id: 1, name: 'party' }, { id: 2, name: 'details' }];
  conditions = [{ id: 1, name: 'equals' }, { id: 2, name: 'contains' }];
  form = new FormGroup({
    id: new FormControl<number | undefined>(undefined),
    field: new FormControl(this.fields[0]),
    condition: new FormControl(this.conditions[0]),
    value: new FormControl('', Validators.required),
    category: new FormControl<Category | undefined>(undefined, Validators.required)
  });
  constructor(private store: Store, @Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<Rule | undefined, { rule: Rule, transaction: Transaction }>, destroy$: TuiDestroyService) {
    this.transaction = context.data?.transaction ?? this.transaction;
    if (context.data?.rule) {
      const rule = context.data.rule;
      const field = rule.conditionType < 3 ? this.fields[0] : this.fields[1];
      const condition = rule.conditionType % 2 ? this.conditions[0] : this.conditions[1];
      this.form.patchValue({ id: rule.id, field: field, condition: condition, value: rule.conditionValue, category: rule.category });
    } else {
      this.form.patchValue({ value: this.transaction.party || this.transaction.details});
    }
    this.form.controls['field'].valueChanges.pipe(takeUntil(destroy$)).subscribe((v) => {
      if (v?.id == 1 && this.transaction.party) {
        this.form.controls['value'].setValue(this.transaction.party);
      }
      else if (v?.id == 2 && this.transaction.details) {
        this.form.controls['value'].setValue(this.transaction.details);
      }
    });
  }

  onCancel(): void {
    this.context.completeWith(undefined);
  }

  onSubmit(): void {
    if (!this.form.value.value || !this.form.value.category) {
      return;
    }
    const conditionType = this.form.value.field?.id == 1 ? (this.form.value.condition?.id == 1 ? 1 : 2) : (this.form.value.condition?.id == 1 ? 3 : 4);
    const rule: Rule = { id: this.form.value.id, conditionType: conditionType, conditionValue: this.form.value.value, category: this.form.value.category };
    this.context.completeWith(rule);
  }
}
