import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { map } from 'rxjs';
import { CategorySum } from '../models/category-sum';

@Component({
  selector: 'app-summary-by-category',
  templateUrl: './summary-by-category.component.html',
  styleUrls: ['./summary-by-category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryByCategoryComponent {
  expenses$ = this.store.select(state => state.acc.expenses).pipe(map((expenses: CategorySum[]) => (Object.values(expenses.reduce((a: any, e) => {
    const key = e.category?.id || 0;
    const s = a[key] || { name: (key<3 ? 'No Category' : e.category?.name), amounts: [] };
    s.amounts.push({ value: e.amount, currency: e.currency });
    a[key] = s;
    return a;
  }, {})) as any[]).sort((a,b)=>a.name.localeCompare(b.name))));

  constructor(private store: Store) { }
}
