import { Component, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { ControlValueAccessor, UntypedFormControl, UntypedFormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDay, TuiDestroyService } from '@taiga-ui/cdk';
import { map, takeUntil } from 'rxjs';
import { AccState } from 'src/app/accounts/accounts.state';
import { Category } from 'src/app/models/category';
import { TransactionType } from 'src/app/models/transaction';
import * as moment from 'moment';
import { Account } from 'src/app/models/account';

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
  form = new UntypedFormGroup({
    'id': new UntypedFormControl(),
    'opdate': new UntypedFormControl(),
    'account': new UntypedFormControl(),
    'credit': new UntypedFormControl(),
    'ccurrency': new UntypedFormControl(),
    'recipient': new UntypedFormControl(),
    'debit': new UntypedFormControl(),
    'dcurrency': new UntypedFormControl(),
    'category': new UntypedFormControl(),
    'party': new UntypedFormControl(''),
    'details': new UntypedFormControl(''),
    'type': new UntypedFormControl()
  });

  get type(): TransactionType {
    return this.form.controls['type'].value;
  }

  get typeString(): string {
    return TransactionType[this.type].toLocaleLowerCase();
  }

  accounts: Account[] = this.store.selectSnapshot(AccState.accounts);
  currencies: string[] = this.store.selectSnapshot(AccState.currencies);
  categories: Category[] = this.store.selectSnapshot(state => state.acc.categories);
  readonly matcher = (category: Category, type: TransactionType): boolean => category.root_id == type;

  get convertation(): boolean {
    return this.form.controls['dcurrency'].value !== this.form.controls['ccurrency'].value;
  }

  get showCredit(): boolean {
    return this.convertation || this.type === TransactionType.Expense || this.type === TransactionType.Correction;
  }

  get showDebit(): boolean {
    return this.convertation || this.type !== TransactionType.Expense;
  }

  get showAccount(): boolean {
    return this.type !== TransactionType.Income;
  }

  get showBalance(): boolean {
    return this.type === TransactionType.Correction;
  }

  get showRecipient(): boolean {
    return this.type === TransactionType.Income || this.type === TransactionType.Transfer;
  }

  get showCategory(): boolean {
    return this.type === TransactionType.Income || this.type === TransactionType.Expense;
  }

  timePart = '';
  constructor(private store: Store, destroy$: TuiDestroyService) {
    this.form.controls['account'].valueChanges.pipe(takeUntil(destroy$)).subscribe(account => {
      if (account) {
        this.form.controls['dcurrency'].setValue(account.currency);
        if (this.type !== TransactionType.Transfer) {
          this.form.controls['ccurrency'].setValue(account.currency);
        }
        if (this.type === TransactionType.Correction) {
          this.form.controls['credit'].setValue(0);
          this.form.controls['debit'].setValue(account.balance);
        }
      }
    });
    this.form.controls['recipient'].valueChanges.pipe(takeUntil(destroy$)).subscribe(account => {
      if (account) {
        this.form.controls['ccurrency'].setValue(account.currency);
        if (this.type !== TransactionType.Transfer) {
          this.form.controls['dcurrency'].setValue(account.currency);
        }
      }
    });
    this.form.controls['type'].valueChanges.pipe(takeUntil(destroy$)).subscribe(type => {
      let account = this.form.controls['account'].value;
      let recipient = this.form.controls['recipient'].value;
      let category = this.form.controls['category'].value;
      if (type === TransactionType.Expense) {
        this.form.controls['ccurrency'].enable();
        this.form.controls['dcurrency'].disable();
        if (!account) {
          this.form.controls['account'].setValue(recipient, {emitEvent: false});
          this.form.controls['dcurrency'].setValue(recipient?.currency, {emitEvent: false});
        }
        if (category?.root_id !== type) {
          this.form.controls['category'].setValue(null, {emitEvent: false});
        }
      } else if (type === TransactionType.Income) {
        this.form.controls['ccurrency'].disable();
        this.form.controls['dcurrency'].enable();
        if (!recipient) {
          this.form.controls['recipient'].setValue(account, {emitEvent: false});
          this.form.controls['ccurrency'].setValue(account?.currency, {emitEvent: false});
        }
        if (category?.root_id !== type) {
          this.form.controls['category'].setValue(null, {emitEvent: false});
        }
      } else if (type === TransactionType.Correction) {
        this.form.controls['ccurrency'].disable();
        this.form.controls['dcurrency'].disable();
      } else if (type === TransactionType.Transfer) {
        this.form.controls['ccurrency'].disable();
        this.form.controls['dcurrency'].disable();
        if (account && (!recipient || account.id === recipient.id)) {
          recipient = this.accounts.find(a => a.id !== account?.id && a.currency === account?.currency);
          this.form.controls['recipient'].setValue(recipient, {emitEvent: false});
        } else if (recipient && (!account || recipient.id === account.id)) {
          account = this.accounts.find(a => a.id !== recipient?.id && a.currency === recipient?.currency);
          this.form.controls['account'].setValue(account, {emitEvent: false});
        }
        this.form.controls['dcurrency'].setValue(account.currency, {emitEvent: false});
        this.form.controls['ccurrency'].setValue(recipient.currency, {emitEvent: false});
      }
    });
    this.form.controls['debit'].valueChanges.pipe(takeUntil(destroy$)).subscribe(value => {
      if (this.type === TransactionType.Correction) {
        this.form.controls['credit'].setValue(value - this.form.controls['account'].value.balance, {emitEvent: false});
      }
    });
    this.form.controls['credit'].valueChanges.pipe(takeUntil(destroy$)).subscribe(value => {
      if (this.type === TransactionType.Correction) {
        this.form.controls['debit'].setValue(this.form.controls['account'].value.balance + (value || 0), {emitEvent: false});
      }
    });
    this.form.valueChanges.pipe(takeUntil(destroy$)).subscribe(value => {
      if (!this.showDebit) {
        value.debit = value.credit;
      }
      if (!this.showCredit) {
        value.credit = value.debit;
      }
      value.currency = value.recipient && value.account ? null : (value.recipient?.currency || value.account?.currency);
      const now = new Date();
      value.opdate = value.opdate ? value.opdate.toLocalNativeDate() : now;
      value.opdate = moment(value.opdate).format('YYYY-MM-DD') + ' ' + this.timePart;
      this.onChange(value);
    });
  }

  writeValue(value: any): void {
    this.form.reset({}, { emitEvent: false });
    const opdate = typeof value.opdate === 'string' ? new Date(value.opdate) : (value.opdate || new Date());
    this.timePart = moment(opdate).format().substring(11);
    const ccurrency = value.account?.currency || value.currency || value.recipient?.currency;
    const dcurrency = value.recipient?.currency || value.currency || value.account?.currency;
    const debit = (value.type === TransactionType.Correction ? (value.account_balance || value.recipient_balance || value.account?.balance) : value.debit)  || undefined;
    const credit = (value.type === TransactionType.Correction && value.account ? -value.credit : value.credit)  || undefined;
    const category = this.categories.find(c => c.id === value.category?.id) || value.category;
    const account = this.accounts.find(a => a.id === value.account?.id) || value.account;
    const recipient = this.accounts.find(a => a.id === value.recipient?.id) || value.recipient;
    this.form.patchValue({ ...value, credit, debit, opdate: TuiDay.fromLocalNativeDate(opdate), ccurrency, dcurrency, category, account, recipient }, { emitEvent: false });
    this.form.controls['type']?.setValue(value.type, {emitEvent: true});
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
