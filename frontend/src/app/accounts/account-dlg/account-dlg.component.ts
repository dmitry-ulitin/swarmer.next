import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDialogContext, TuiDialogService } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { firstValueFrom } from 'rxjs';
import { AppPrintError } from 'src/app/app.state';
import { ApiService } from 'src/app/services/api.service';
import { Group } from '../../models/group';

@Component({
  selector: 'app-account-dlg',
  templateUrl: './account-dlg.component.html',
  styleUrls: ['./account-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountDialogComponent {
  group = new UntypedFormControl();

  constructor(
    private api: ApiService,
    private store: Store,
    @Inject(TuiDialogService) private readonly dialogService: TuiDialogService,
    @Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<Group | undefined, Group>
  ) {
    this.group.setValue(this.context.data);
  }

  onCancel(): void {
    this.context.completeWith(undefined);
  }

  async onSubmit() {
    try {
      let group = this.group.value;
      if (!group?.fullname) {
        this.store.dispatch(new AppPrintError("Group name is required"));
        return;
      }
      group = await firstValueFrom(this.api.saveGroup(group));
      this.context.completeWith(group);
    } catch (err) {
      this.store.dispatch(new AppPrintError(err));
    }
  }
}
