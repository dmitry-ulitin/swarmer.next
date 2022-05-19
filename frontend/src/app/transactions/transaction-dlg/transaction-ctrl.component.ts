import { Component, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDay, TuiDestroyService } from '@taiga-ui/cdk';
import { map, takeUntil } from 'rxjs';
import { AccState } from 'src/app/accounts/accounts.state';
import { Category } from 'src/app/models/category';
import { TransactionType } from 'src/app/models/transaction';
import * as moment from 'moment';

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
    return TransactionType[this.type].toLocaleLowerCase();
  }

  accounts = this.store.selectSnapshot(AccState.accounts);
  categories$ = this.store.select(state => state.acc.categories).pipe(map(categories => categories.filter((c: Category) => c.root_id === this.type)));
  currencies = this.store.selectSnapshot(AccState.currencies);

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
          this.form.controls['recipient'].setValue(this.accounts.find(a => a.id !== account?.id && a.currency === account?.currency), {emitEvent: false});
        } else if (recipient && (!account || recipient.id === account.id)) {
          this.form.controls['account'].setValue(this.accounts.find(a => a.id !== recipient?.id && a.currency === recipient?.currency), {emitEvent: false});
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
      if (!value.ccurrency || !value.dcurrency || value.ccurrency === value.dcurrency) {
        value.credit = value.debit = value.credit || value.debit;
      }
      value.currency = !value.recipient ? value.dcurrency : (!value.account ? value.ccurrency : null);
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
    const credit = (value.type === TransactionType.Correction ? 0 : value.credit)  || undefined;
    this.form.patchValue({ ...value, credit, debit, opdate: TuiDay.fromLocalNativeDate(opdate), ccurrency, dcurrency }, { emitEvent: false });
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
