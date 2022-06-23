import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { TuiDialogContext } from '@taiga-ui/core';
import { TuiFileLike } from '@taiga-ui/kit';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { Subject } from 'rxjs';

@Component({
  templateUrl: './input-file-dlg.component.html',
  styleUrls: ['./input-file-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputFileDlgComponent {
  readonly control = new UntypedFormControl();
  readonly rejectedFiles$ = new Subject<TuiFileLike | null>();

  constructor(@Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<TuiFileLike | null, undefined>) {
  }

  onReject(file: TuiFileLike | readonly TuiFileLike[]): void {
      this.rejectedFiles$.next(file as TuiFileLike);
  }

  removeFile(): void {
      this.control.setValue(null);
  }

  clearRejected(): void {
      this.rejectedFiles$.next(null);
  }

  onNext() {
    this.context.completeWith(this.control.value);
  }

  onCancel() {
    this.context.completeWith(null);
  }
}
