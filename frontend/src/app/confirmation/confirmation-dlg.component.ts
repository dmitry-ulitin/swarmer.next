import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

@Component({
  templateUrl: './confirmation-dlg.component.html',
  styleUrls: ['./confirmation-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationDlgComponent {
  message = '';

  constructor(@Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<boolean, string>) {
    this.message = this.context.data;
  }

  onYes(): void {
    this.context.completeWith(true);
  }

  onNo(): void {
    this.context.completeWith(false);
  }
}
