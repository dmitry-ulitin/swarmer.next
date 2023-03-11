import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { TuiDialogContext } from '@taiga-ui/core';
import { TuiFileLike } from '@taiga-ui/kit';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { Subject } from 'rxjs';

@Component({
  templateUrl: './load-dump-dlg.component.html',
  styleUrls: ['./load-dump-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadDumpDlgComponent {
  readonly files = new UntypedFormControl();
  readonly rejectedFiles$ = new Subject<TuiFileLike | null>();

  constructor(@Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<TuiFileLike | null, undefined>) {
  }

  onReject(file: TuiFileLike | readonly TuiFileLike[]): void {
      this.rejectedFiles$.next(file as TuiFileLike);
  }

  removeFile(): void {
      this.files.setValue(null);
  }

  clearRejected(): void {
      this.rejectedFiles$.next(null);
  }

  onNext() {
    this.context.completeWith(this.files.value);
  }

  onCancel() {
    this.context.completeWith(null);
  }
}
