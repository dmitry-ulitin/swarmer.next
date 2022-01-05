import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDialogContext, TuiDialogService } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { Group } from '../models/group';

@Component({
  selector: 'app-account-dlg',
  templateUrl: './account-dlg.component.html',
  styleUrls: ['./account-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountDialogComponent {
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
    private store: Store,
    @Inject(TuiDialogService) private readonly dialogService: TuiDialogService,
    @Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<Group, Group>
  ) {
    this.patch(context.data);
  }

  patch(value: Group): void {
    this.form.patchValue(value || {});
    this.accounts.clear();
    (value?.accounts || [{name: '', currency: 'RUB', start_balance: 0}]).forEach(a => this.accounts.push(new FormGroup({
      'id': new FormControl(a.id),
      'name': new FormControl(a.name),
      'currency': new FormControl(a.currency),
      'start_balance': new FormControl(a.start_balance)})
    ));
  }
}
