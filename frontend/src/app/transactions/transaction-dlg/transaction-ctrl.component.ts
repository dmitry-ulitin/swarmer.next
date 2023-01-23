import { Component, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { ControlValueAccessor, UntypedFormControl, UntypedFormGroup, NG_VALUE_ACCESSOR, NG_VALIDATORS, FormControl, ValidationErrors } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDay, TuiDestroyService } from '@taiga-ui/cdk';
import { firstValueFrom, map, takeUntil } from 'rxjs';
import { AccState, TransactionView } from 'src/app/accounts/accounts.state';
import { Category } from 'src/app/models/category';
import { TransactionType } from 'src/app/models/transaction';
import * as moment from 'moment';
import { Account } from 'src/app/models/account';
import { ApiService } from 'src/app/services/api.service';
import { AppPrintError } from 'src/app/app.state';

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
    {
      provide: NG_VALIDATORS,
      useExisting: TransactionCtrlComponent,
      multi: true
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
    'newcategory': new UntypedFormControl(),
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
  readonly matcher = (category: Category, type: TransactionType): boolean => category.level > 0 && category.type == type;
  newcategory = false;

  get convertation(): boolean {
    const dcurrency = this.form.controls['dcurrency'].value;
    const ccurrency = this.form.controls['ccurrency'].value;
    return !!dcurrency && !!ccurrency && dcurrency !== ccurrency;
  }

  get showCredit(): boolean {
    return this.convertation || this.type === TransactionType.Expense || this.type === TransactionType.Correction;
  }

  get showDebit(): boolean {
    return this.convertation || this.type !== TransactionType.Expense;
  }

  get showAccount(): boolean {
    return this.type === TransactionType.Expense || this.type === TransactionType.Transfer || (this.type === TransactionType.Correction && !!this.form.controls['account'].value);
  }

  get showRecipient(): boolean {
    return this.type === TransactionType.Income || this.type === TransactionType.Transfer || (this.type === TransactionType.Correction && !!this.form.controls['recipient'].value);
  }

  get showCategory(): boolean {
    return this.type === TransactionType.Income || this.type === TransactionType.Expense;
  }

  get categoryParent(): string {
    const category = this.form.controls['category'].value;
    return category == null ? '' : (category.fullname + ' / ');
  }

  timePart = '';
  constructor(private store: Store, private api: ApiService, destroy$: TuiDestroyService) {
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
          this.form.controls['account'].setValue(recipient, { emitEvent: false });
          this.form.controls['dcurrency'].setValue(recipient?.currency, { emitEvent: false });
        }
        if (category?.type !== type) {
          this.form.controls['category'].setValue(null, { emitEvent: false });
        }
      } else if (type === TransactionType.Income) {
        this.form.controls['ccurrency'].disable();
        this.form.controls['dcurrency'].enable();
        if (!recipient) {
          this.form.controls['recipient'].setValue(account, { emitEvent: false });
          this.form.controls['ccurrency'].setValue(account?.currency, { emitEvent: false });
        }
        if (category?.type !== type) {
          this.form.controls['category'].setValue(null, { emitEvent: false });
        }
      } else if (type === TransactionType.Correction) {
        this.form.controls['ccurrency'].disable();
        this.form.controls['dcurrency'].disable();
      } else if (type === TransactionType.Transfer) {
        const transactions = store.selectSnapshot(state => state.acc.transactions);
        this.form.controls['ccurrency'].disable();
        this.form.controls['dcurrency'].disable();
        if (account && (!recipient || account.id === recipient.id)) {
          recipient = transactions.find((t: TransactionView) => t.type === TransactionType.Transfer && t.account?.id === account.id)?.recipient ??
            this.accounts.find(a => a.id !== account?.id && a.currency === account?.currency);
          this.form.controls['recipient'].setValue(recipient, { emitEvent: false });
        } else if (recipient && (!account || recipient.id === account.id)) {
          account = transactions.find((t: TransactionView) => t.type === TransactionType.Transfer && t.recipient?.id === recipient.id)?.account ??
            this.accounts.find(a => a.id !== recipient?.id && a.currency === recipient?.currency);
          this.form.controls['account'].setValue(account, { emitEvent: false });
        }
        this.form.controls['dcurrency'].setValue(account.currency, { emitEvent: false });
        this.form.controls['ccurrency'].setValue(recipient.currency, { emitEvent: false });
      }
    });
    this.form.controls['debit'].valueChanges.pipe(takeUntil(destroy$)).subscribe(value => {
      if (this.type === TransactionType.Correction) {
        this.form.controls['credit'].setValue(value - this.form.controls['account'].value.balance, { emitEvent: false });
      }
    });
    this.form.controls['credit'].valueChanges.pipe(takeUntil(destroy$)).subscribe(value => {
      if (this.type === TransactionType.Correction) {
        this.form.controls['debit'].setValue(this.form.controls['account'].value.balance + (value || 0), { emitEvent: false });
      }
    });
    this.form.controls['opdate'].valueChanges.pipe(takeUntil(destroy$)).subscribe(value => {
      const date = value ? value.toLocalNativeDate() : new Date();
      this.onDateValueChanges(moment(date).format('YYYY-MM-DD') + ' ' + this.timePart);
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
      if (this.newcategory) {
        let parent = value.category;
        value.category = { id: null, name: value.newcategory, fullname: (parent ? (parent.fullname + ' / ') : '') + value.newcategory, level: parent ? parent.level + 1 : 1, type: value.type, parent_id: parent ? parent.id : value.type }
      }
      this.onChange(value);
    });
  }

  writeValue(value: any): void {
    this.form.reset({}, { emitEvent: false });
    const opdate = typeof value.opdate === 'string' ? new Date(value.opdate) : (value.opdate || new Date());
    this.timePart = moment(opdate).format().substring(11);
    const ccurrency = value.account?.currency || value.currency || value.recipient?.currency;
    const dcurrency = value.recipient?.currency || value.currency || value.account?.currency;
    const debit = (value.type === TransactionType.Correction ? (value.account_balance || value.recipient_balance || value.account?.balance || value.recipient?.balance) : value.debit) || undefined;
    const credit = (value.type === TransactionType.Correction && value.account ? -value.credit : value.credit) || undefined;
    const category = this.categories.find(c => c.id === value.category?.id) || value.category;
    const account = this.accounts.find(a => a.id === value.account?.id) || value.account;
    const recipient = this.accounts.find(a => a.id === value.recipient?.id) || value.recipient;
    this.form.patchValue({ ...value, credit, debit, opdate: TuiDay.fromLocalNativeDate(opdate), ccurrency, dcurrency, category, account, recipient }, { emitEvent: false });
    this.form.controls['type']?.setValue(value.type, { emitEvent: true });
    this.newcategory = false;
    this.onDateValueChanges(moment(opdate).format('YYYY-MM-DD') + ' ' + this.timePart);
  }

  onYesterday(): void {
    const opdate: TuiDay = this.form.controls['opdate'].value;
    this.form.controls['opdate'].setValue(opdate.append({ day: -1 }));
  }

  onToday(): void {
    this.form.controls['opdate'].setValue(TuiDay.currentLocal());
  }

  onTomorrow(): void {
    const opdate: TuiDay = this.form.controls['opdate'].value;
    this.form.controls['opdate'].setValue(opdate.append({ day: 1 }));
  }

  onCreateCategory() {
    this.newcategory = true;
    this.form.controls['newcategory'].setValue('');
  }

  onCancelCategory() {
    this.newcategory = false;
    this.form.controls['newcategory'].setValue(null);
  }

  validate({ value }: FormControl): ValidationErrors | null {
    const ccurrency = this.form.controls['ccurrency'].value;
    const dcurrency = this.form.controls['dcurrency'].value;
    const valid = (!this.showCredit || (!!value.credit && !!ccurrency)) && (!this.showDebit || (!!value.debit && !!dcurrency)) && (!this.newcategory || !!value.newcategory) || (value.type === TransactionType.Correction);
    return { invalid: !valid };
  }

  async onDateValueChanges(opdate: string) {
    console.log(opdate);
    try {
      const groups = await firstValueFrom(this.api.getGroups(opdate));
      this.accounts = groups.filter(g => !g.deleted).reduce((acc, g) => acc.concat(g.accounts), [] as Account[]).filter(a => !a.deleted);
      const value = this.form.getRawValue();
      const account = this.accounts.find(a => a.id === value.account?.id) || value.account;
      const recipient = this.accounts.find(a => a.id === value.recipient?.id) || value.recipient;
      const debit = (value.type === TransactionType.Correction ? ((account?.balance || recipient?.balance) + (value.credit || 0)) : value.debit) || undefined;

      this.form.patchValue({ account, debit, recipient }, { emitEvent: false });
    } catch (err) {
      this.store.dispatch(new AppPrintError(err));
    }
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
