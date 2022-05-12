import { Component, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDay, TuiDestroyService } from '@taiga-ui/cdk';
import { map, takeUntil } from 'rxjs';
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
    'party': new FormControl(''),
    'details': new FormControl(''),
    'type': new FormControl()
  });

  get type(): TransactionType {
    return this.form.controls['type'].value;
  }

  get typeString(): string {
    return this.type === TransactionType.Expense ? 'expense' : (this.type === TransactionType.Income ? 'income' : 'transfer');
  }

  accounts$ = this.store.select(AccState.accounts);
  categories$ = this.store.select(state => state.acc.categories).pipe(map(categories => categories.filter((c: Category) => c.root_id === this.type)));
  currencies = this.store.selectSnapshot(AccState.currencies);

  get convertation(): boolean {
    return this.form.controls['dcurrency'].value !== this.form.controls['ccurrency'].value;
  }

  get showCredit(): boolean {
    return this.convertation || this.type === TransactionType.Expense;
  }

  get showDebit(): boolean {
    return this.convertation || this.type !== TransactionType.Expense;
  }

  get showAccount(): boolean {
    return this.type !== TransactionType.Income;
  }

  get showRecipient(): boolean {
    return this.type !== TransactionType.Expense;
  }

  get showCategory(): boolean {
    return this.type !== TransactionType.Transfer;
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
    this.form.valueChanges.pipe(takeUntil(destroy$)).subscribe(value => {
      if (!value.ccurrency || !value.dcurrency || value.ccurrency === value.dcurrency) {
        value.credit = value.debit = value.debit || value.credit;
      }
      value.currency = !value.recipient ? value.dcurrency : (!value.account ? value.ccurrency : null);
      const now = new Date();
      value.opdate = value.opdate ? value.opdate.toLocalNativeDate() : now;
      value.opdate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      this.onChange(value);
    });
  }

  writeValue(value: any): void {
    this.form.reset({}, { emitEvent: false });
    const opdate = typeof value.opdate === 'string' ? new Date(value.opdate) : (value.opdate || new Date());
    const ccurrency = value.account?.currency || value.currency || value.recipient?.currency;
    const dcurrency = value.recipient?.currency || value.currency || value.account?.currency;
    this.form.patchValue({ ...value, credit: value.credit || undefined, debit: value.debit || undefined, opdate: TuiDay.fromLocalNativeDate(opdate), ccurrency, dcurrency });
  }

  onYesterday(): void {
    const opdate: TuiDay = this.form.controls['opdate'].value;
    this.form.controls['opdate'].setValue(opdate.append({ day: 1 }, true));
  }

  onToday(): void {
    this.form.controls['opdate'].setValue(TuiDay.currentLocal());
  }

  onTomorrow(): void {
    const opdate: TuiDay = this.form.controls['opdate'].value;
    this.form.controls['opdate'].setValue(opdate.append({ day: 1 }, false));
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
