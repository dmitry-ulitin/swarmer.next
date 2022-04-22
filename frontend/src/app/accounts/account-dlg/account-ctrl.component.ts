import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormArray, FormControl, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { Account } from 'src/app/models/account';
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

  form = new FormGroup({
    'id': new FormControl(),
    'fullname': new FormControl(''),
    'is_owner': new FormControl(true),
    'is_coowner': new FormControl(false),
    'is_shared': new FormControl(false),
    'accounts': new FormArray([]),
    'permissions': new FormArray([])
  });

  get accounts(): FormArray {
    return this.form.controls.accounts as FormArray;
  }

  getAccount(index: number): FormGroup {
    return this.accounts.controls[index] as FormGroup;
  }

  constructor(
    private store: Store, destroy$: TuiDestroyService) {
  }

  patch(value: Group): void {
    this.form.reset({}, { emitEvent: false });
    this.form.patchValue(value || {});
    this.accounts.clear();
    (value?.accounts || [null]).forEach(a => this.onAddAccount(a));
    if (!this.canDelete) {
      this.accounts.controls.filter(a => !a.get('deleted')?.value)[0].get('name')?.disable();
    }
  }

  get canDelete(): boolean {
    return this.accounts.controls.filter(a => !a.get('deleted')?.value).length > 1;
  }

  onAddAccount(a: any): void {
    this.accounts.push(new FormGroup({
      'id': new FormControl(a?.id),
      'name': new FormControl(a?.name || ''),
      'currency': new FormControl(a?.currency || 'RUB'),
      'start_balance': new FormControl(a?.start_balance),
      'deleted': new FormControl(a?.deleted)
    }));
    this.accounts.controls.filter(a => !a.get('deleted')?.value)[0].get('name')?.enable();
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
