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
  readonly banks = [{id:1, name: 'LHV'}, {id:2, name: 'Tinkoff'}, {id:3, name: 'Сбербанк'}, {id:4, name: 'Альфа-Банк'}];
  readonly files = new UntypedFormControl();
  readonly bank = new UntypedFormControl(this.banks[0]);
  readonly rejectedFiles$ = new Subject<TuiFileLike | null>();

  constructor(@Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<{bank: number,file:TuiFileLike} | null, undefined>) {
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
    this.context.completeWith({bank: this.bank.value.id, file: this.files.value});
  }

  onCancel() {
    this.context.completeWith(null);
  }
}
