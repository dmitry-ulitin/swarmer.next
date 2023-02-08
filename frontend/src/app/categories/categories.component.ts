import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { EMPTY_ARRAY, TuiHandler } from '@taiga-ui/cdk';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { map } from 'rxjs';
import { GetCategories } from 'src/app/accounts/accounts.state';
import { Category } from 'src/app/models/category';
import { TransactionType } from 'src/app/models/transaction';

interface TreeNode {
  readonly category: Category;
  readonly children: TreeNode[];
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriesComponent {
  categories$ = this.store.select(state => state.acc.categories).pipe(map((categories: Category[]) => {
    const tree: TreeNode[] = [];
    map2tree(categories, 0, tree, this.map);
    return tree;
  }));
  readonly handler: TuiHandler<TreeNode, readonly TreeNode[]> = item => item.children || EMPTY_ARRAY;
  readonly map = new Map<TreeNode, boolean>();
  selected: number | null = 1;

  constructor(private store: Store, @Inject(POLYMORPHEUS_CONTEXT) private readonly context: TuiDialogContext) { }

  setAsSelected(node: TreeNode) {
    this.selected = node.category.id;
  }

  isSelected(node: TreeNode) {
    if (node.category.id === this.selected) {
      let parent_id = node.category.parent_id;
      while (!!parent_id) {
        const key = [...this.map.keys()].find(n => n.category.id === parent_id);
        if (!key || !this.map.get(key)) {
          return false;
        }
        parent_id = key.category.parent_id;
      }
      return true;
    }
    return false;
  }

  onRefresh() {
    this.store.dispatch(new GetCategories());
  }

  onAdd() {
//    this.context.completeWith({id: this.selected});
  }

  onEdit() {
//    this.context.completeWith({id: this.selected});
  }

  onDelete() {
//    this.context.completeWith({id: this.selected});
  }
}

function map2tree(data: Category[], index: number, tree: TreeNode[], map: Map<TreeNode, boolean>) {
  const level = data[index].level;
  while (index < data.length && data[index].level >= level) {
    if (data[index].level === 0 && data[index].type === TransactionType.Correction) {
      index++;
      continue;
    }
    if (data[index].level > level) {
      index = map2tree(data, index, tree[tree.length - 1].children, map);
    } else {
      const item = {category: data[index++], children: []};
      tree.push(item);      
      const key = [...map.keys()].find(n => n.category.id === item.category.id);
      if (key) {
        map.set(item, map.get(key) || false);
        map.delete(key);
      } else {
        map.set(item, false);
      }
    }
  }
  return index;
}
