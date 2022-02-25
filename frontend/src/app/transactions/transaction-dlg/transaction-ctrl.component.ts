import { Component, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AccState } from 'src/app/accounts/accounts.state';

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
    }
  ]
})
export class TransactionCtrlComponent implements ControlValueAccessor {
  accounts$ = this.store.select(AccState.accounts);
  categories$ = this.store.select(state => state.acc.categories);
  currencies = this.store.selectSnapshot(AccState.currencies);

  form = new FormGroup({
    'id': new FormControl(),
    'opdate': new FormControl(),
    'account': new FormControl(),
    'credit': new FormControl(),
    'recipient': new FormControl(),
    'debit': new FormControl(),
    'category': new FormControl(),
    'currency': new FormControl(),
    'details': new FormControl('')
  });

  constructor(private store: Store) { }

  writeValue(obj: any): void {
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
