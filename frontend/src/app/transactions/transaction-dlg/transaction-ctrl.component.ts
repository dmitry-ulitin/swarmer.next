import { Component, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDay, TuiDestroyService } from '@taiga-ui/cdk';
import { map, startWith, takeUntil, withLatestFrom } from 'rxjs';
import { AccState } from 'src/app/accounts/accounts.state';
import { Category } from 'src/app/models/category';
import { TransactionType } from 'src/app/models/transaction';

@Component({
  selector: 'app-transaction-ctrl',
  templateUrl: './transaction-ctrl.component.html',
  styleUrls: ['./transaction-ctrl.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TransactionCtrlComponent),
      multi: true,
    },
    TuiDestroyService
  ]
})
export class TransactionCtrlComponent implements ControlValueAccessor {
  form = new FormGroup({
    'id': new FormControl(),
    'opdate': new FormControl(),
    'account': new FormControl(),
    'credit': new FormControl(),
    'ccurrency': new FormControl(),
    'recipient': new FormControl(),
    'debit': new FormControl(),
    'dcurrency': new FormControl(),
    'category': new FormControl(),
    'details': new FormControl(''),
    'type': new FormControl()
  });

  type: TransactionType = TransactionType.Transfer;
  
  accounts$ = this.store.select(AccState.accounts);
  categories$ = this.store.select(state => state.acc.categories).pipe(map(categories => categories.filter((c: Category) => c.root_id === this.type)));
  currencies = this.store.selectSnapshot(AccState.currencies);

  get convertation(): boolean {
    return this.form.controls['dcurrency'].value !== this.form.controls['ccurrency'].value;
  }

  get showCredit(): boolean {
    return this.convertation || this.type !== TransactionType.Income;
  }

  get showDebit(): boolean {
    return this.convertation || this.type === TransactionType.Income;
  }

  get showAccount(): boolean {
    return this.type !== TransactionType.Income;
  }

  get showRecipient(): boolean {
    return this.type !== TransactionType.Expense;
  }

  constructor(private store: Store, destroy$: TuiDestroyService) {
    this.form.controls['account'].valueChanges.pipe(takeUntil(destroy$)).subscribe(account => {
      if (account) {
        this.form.controls['ccurrency'].setValue(account.currency);
        if (this.type === TransactionType.Expense) {
          this.form.controls['dcurrency'].setValue(account.currency);
        }
      }
    });
    this.form.controls['recipient'].valueChanges.pipe(takeUntil(destroy$)).subscribe(account => {
      if (account) {
        this.form.controls['dcurrency'].setValue(account.currency);
        if (this.type === TransactionType.Income) {
          this.form.controls['ccurrency'].setValue(account.currency);
        }
      }
    });
    this.form.controls['type'].valueChanges.pipe(takeUntil(destroy$)).subscribe(type => {
      this.type = type;
      if (type === TransactionType.Expense) {
        this.form.controls['ccurrency'].enable();
        this.form.controls['dcurrency'].disable();
      } else if (type === TransactionType.Income) {
        this.form.controls['ccurrency'].disable();
        this.form.controls['dcurrency'].enable();
      } else {
        this.form.controls['ccurrency'].disable();
        this.form.controls['dcurrency'].disable();
      }
    });
  }

  writeValue(value: any): void {
    this.form.reset({}, { emitEvent: false });
    const opdate = new TuiDay(value.opdate.getFullYear(), value.opdate.getMonth(), value.opdate.getDate());
    this.form.patchValue({ ...value, credit: value.credit || undefined, debit: value.debit || undefined, opdate });
  }

  onYesterday(): void {
  }

  onToday(): void {
  }

  onTomorrow(): void {
  }

  onChange: any = () => { };
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  onTouched: any = () => { };
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
