import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDialogContext, TuiDialogService } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { Group } from '../../models/group';

@Component({
  selector: 'app-account-dlg',
  templateUrl: './account-dlg.component.html',
  styleUrls: ['./account-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountDialogComponent {
  account = new FormControl();

  constructor(
    private store: Store,
    @Inject(TuiDialogService) private readonly dialogService: TuiDialogService,
    @Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<Group | undefined, Group>
  ) {
    this.account.setValue(this.context.data);
  }
  
  onCancel(): void {
    this.context.completeWith(undefined);
  }

  onSubmit(): void {
  }
}
