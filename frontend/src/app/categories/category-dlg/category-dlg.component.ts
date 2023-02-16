import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { Category } from 'src/app/models/category';
import { TransactionType } from 'src/app/models/transaction';

@Component({
  selector: 'app-category-dlg',
  templateUrl: './category-dlg.component.html',
  styleUrls: ['./category-dlg.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryDlgComponent {
  categories: Category[] = this.store.selectSnapshot(state => state.acc.categories);
  form = new FormGroup({
    id: new FormControl<number|null>(null),
    name: new FormControl('', [Validators.required]),
    fullname: new FormControl(''),
    level: new FormControl(1),
    parent: new FormControl(this.categories[0]),
    parent_id: new FormControl(this.categories[0]?.id),
    type: new FormControl(TransactionType.Expense, [Validators.required]),
  });
  readonly matcher = (category: Category, type: TransactionType): boolean => {
    if (category.type == type) {
      let id = this.form.value.id;
      let parent_id = category.id;
      while (!!parent_id) {
        if (parent_id === id) {
          return false;
        }
        const parent = this.categories.find(c => c.id == parent_id);
        parent_id = parent?.parent_id || 0;
      }
      return true;
    }
    return false;
  }
  readonly identityMatcher = (e: Category, a: Category): boolean => e.id === a.id;
  get categoryParent(): string {
    const category = this.form.controls['parent'].value;
    return category?.level ? (category.fullname + ' / ') : '';
  }

  constructor(private store: Store, @Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext<Category | undefined, Category>) {
    this.form.patchValue({...context.data, parent: this.categories.find(c => c.id == context.data?.parent_id)});
  }

  onSubmit() {
    if (this.form.valid) {
      const category: any = this.form.value;
      category.parent_id = category.parent?.id;
      this.context.completeWith(category);
    }
  }

  onCancel() {
    this.context.completeWith(undefined);
  }
}
