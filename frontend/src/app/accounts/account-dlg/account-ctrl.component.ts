import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, UntypedFormArray, UntypedFormControl, UntypedFormGroup, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { takeUntil } from 'rxjs';
import { AppState } from 'src/app/app.state';
import { Group } from '../../models/group';
import { AccState } from '../accounts.state';

@Component({
  selector: 'app-account-ctrl',
  templateUrl: './account-ctrl.component.html',
  styleUrls: ['./account-ctrl.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AccountCtrlComponent),
      multi: true,
    },
    TuiDestroyService
  ]
})
export class AccountCtrlComponent implements ControlValueAccessor {
  currencies = this.store.selectSnapshot(AccState.currencies);
  userCurrency = this.store.selectSnapshot(AppState.claims)?.currency || 'RUB';

  form = new UntypedFormGroup({
    'id': new UntypedFormControl(),
    'fullname': new UntypedFormControl('', Validators.required),
    'is_owner': new UntypedFormControl(true),
    'is_coowner': new UntypedFormControl(false),
    'is_shared': new UntypedFormControl(false),
    'accounts': new UntypedFormArray([]),
    'permissions': new UntypedFormArray([])
  });

  get accounts(): UntypedFormArray {
    return this.form.controls.accounts as UntypedFormArray;
  }

  getAccount(index: number): UntypedFormGroup {
    return this.accounts.controls[index] as UntypedFormGroup;
  }

  constructor(private store: Store, destroy$: TuiDestroyService) {
    this.form.valueChanges.pipe(takeUntil(destroy$)).subscribe(value => this.onChange(value));
  }

  patch(value: Group): void {
    this.form.reset({}, { emitEvent: false });
    this.form.patchValue(value || {});
    this.accounts.clear();
    (value?.accounts || [null]).forEach(a => this.onAddAccount(a));
    if (!this.canDelete) {
      this.accounts.controls.filter(a => !a.get('deleted')?.value)[0].get('name')?.disable();
    }
    if (!!value?.id) {
      this.accounts.controls.forEach(c => c.get('start_balance')?.disable());
      this.accounts.controls.forEach(c => c.get('currency')?.disable());
    }
  }

  get canDelete(): boolean {
    return this.accounts.controls.filter(a => !a.get('deleted')?.value).length > 1;
  }

  onAddAccount(acc: any): void {
    this.accounts.push(new UntypedFormGroup({
      'id': new UntypedFormControl(acc?.id),
      'name': new UntypedFormControl(acc?.name || ''),
      'currency': new UntypedFormControl(acc?.currency || this.userCurrency),
      'start_balance': new UntypedFormControl(acc?.start_balance),
      'balance': new UntypedFormControl(acc?.balance),
      'deleted': new UntypedFormControl(acc?.deleted)
    }));
    this.accounts.controls.filter(a => !a.get('deleted')?.value)[0]?.get('name')?.enable();
  }

  onRemoveAccount(index: number): void {
    this.accounts.controls[index].get('deleted')?.setValue(true);
    if (!this.canDelete) {
      this.accounts.controls.filter(a => !a.get('deleted')?.value)[0].get('name')?.disable();
    }
  }

  writeValue(value: any): void {
    this.patch(value);
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
