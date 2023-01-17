import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormArray, FormControl, FormGroup, NG_VALUE_ACCESSOR, Validators, NG_VALIDATORS, ValidationErrors, UntypedFormArray } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDestroyService } from '@taiga-ui/cdk';
import { debounceTime, filter, map, of, switchMap, takeUntil, tap } from 'rxjs';
import { AppState } from 'src/app/app.state';
import { ApiService } from 'src/app/services/api.service';
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
    {
      provide: NG_VALIDATORS,
      useExisting: AccountCtrlComponent,
      multi: true
    },
    TuiDestroyService
  ]
})
export class AccountCtrlComponent implements ControlValueAccessor {
  currencies = this.store.selectSnapshot(AccState.currencies);
  userCurrency = this.store.selectSnapshot(AppState.claims)?.currency || 'RUB';
  userEmail = `${this.store.selectSnapshot(AppState.claims)?.email || ''}`;
  options = [{ id: 0, name: 'read' }, { id: 1, name: 'write' }, { id: 3, name: 'admin' }];
  rights = new FormControl(this.options[0]);
  query = new FormControl('');
  users$ = this.query.valueChanges.pipe(tap(v => this.selected=''),debounceTime(500), switchMap(q => !!q && q.length > 2 ? this.api.getUsers(q || '') : of([])),
    map(a => a.filter(u => u !== this.form.value.ownerEmail && !this.permissions.controls.find(p => p.value.user.email === u))));
  selected = '';

  form = new FormGroup({
    'id': new FormControl(),
    'fullname': new FormControl('', Validators.required),
    'is_owner': new FormControl(true),
    'is_coowner': new FormControl(false),
    'is_shared': new FormControl(false),
    'ownerEmail': new FormControl(this.userEmail),
    'accounts': new UntypedFormArray([]),
    'permissions': new UntypedFormArray([])
  });

  get accounts(): UntypedFormArray {
    return this.form.controls['accounts'] as UntypedFormArray;
  }

  getAccount(index: number): FormGroup {
    return this.accounts.controls[index] as FormGroup;
  }

  get permissions(): UntypedFormArray {
    return this.form.controls['permissions'] as UntypedFormArray;
  }

  get isOwnerOrCoowner(): boolean {
    return !!this.form.value.is_owner || !!this.form.value.is_coowner;
  }

  getPermission(index: number): FormGroup {
    return this.permissions.controls[index] as FormGroup;
  }

  constructor(private store: Store, private api: ApiService, destroy$: TuiDestroyService) {
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
    (value?.permissions || [null]).forEach(p => this.addPermission(p));
  }

  get canDelete(): boolean {
    return this.accounts.controls.filter(a => !a.get('deleted')?.value).length > 1;
  }

  onAddAccount(acc: any): void {
    this.accounts.push(new FormGroup({
      'id': new FormControl(acc?.id),
      'name': new FormControl(acc?.name || ''),
      'currency': new FormControl(acc?.currency || this.userCurrency),
      'start_balance': new FormControl(acc?.start_balance),
      'balance': new FormControl(acc?.balance),
      'deleted': new FormControl(acc?.deleted)
    }));
    this.accounts.controls.filter(a => !a.get('deleted')?.value)[0]?.get('name')?.enable();
  }

  onRemoveAccount(index: number): void {
    this.accounts.controls[index].get('deleted')?.setValue(true);
    if (!this.canDelete) {
      this.accounts.controls.filter(a => !a.get('deleted')?.value)[0].get('name')?.disable();
    }
  }

  onAddPermission(): void {
    const option = this.rights.value || this.options[0];
    this.addPermission({ user: { email: this.selected }, is_readonly: option.id === 0, is_admin: option.id === 3 });
    this.query.setValue('');
    this.rights.setValue(this.options[0]);
  }
  
  addPermission(p: any): void {
    this.permissions.push(new FormGroup({
      'user': new FormGroup({
        'id': new FormControl(p?.user?.id),
        'email': new FormControl(p?.user?.email),
        'name': new FormControl(p?.user?.name)
      }),
      'is_readonly': new FormControl(!!p?.is_readonly && !p?.is_admin),
      'is_write': new FormControl(!p?.is_readonly || !!p?.is_admin),
      'is_admin': new FormControl(p?.is_admin),
    }));
  }

  onToggleAdmin(event: any, index: number): void {
    if (event.target.checked) {
      this.getPermission(index).get('is_readonly')?.setValue(false);
      this.getPermission(index).get('is_write')?.setValue(true);
      this.getPermission(index).get('is_write')?.disable();
    } else {
      this.getPermission(index).get('is_write')?.enable();
    }
  }

  onRemovePermission(index: number): void {
    this.permissions.removeAt(index);
  }

  onSelectedUser(user: string): void {
    this.selected = user;
  }

  validate({ value }: FormControl): ValidationErrors | null {
    const valid = !!value?.fullname;
    return { invalid: !valid };
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
