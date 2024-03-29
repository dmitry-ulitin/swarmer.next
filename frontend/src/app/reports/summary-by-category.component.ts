import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { map } from 'rxjs';
import { SetCategory } from '../accounts/accounts.state';
import { Category } from '../models/category';
import { CategorySum } from '../models/category-sum';

@Component({
  selector: 'app-summary-by-category',
  templateUrl: './summary-by-category.component.html',
  styleUrls: ['./summary-by-category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryByCategoryComponent {
  income$ = this.store.select(state => state.acc.income.filter((e: CategorySum) => !state.acc.currency || e.currency===state.acc.currency)).pipe(map((expenses: CategorySum[]) => (Object.values(expenses.reduce((a: any, e) => {
    const key = e.category?.id || 0;
    const s = a[key] || { category: {...e.category, id: key<3 ? -key : key, fullname: key<3 ? "No Category" : e.category?.fullname}, amounts: [] };
    s.amounts.push({ value: e.amount, currency: e.currency });
    a[key] = s;
    return a;
  }, {})) as any[]).sort((a,b)=>a.category.fullname.localeCompare(b.category.fullname))));

  expenses$ = this.store.select(state => state.acc.expenses.filter((e: CategorySum) => !state.acc.currency || e.currency===state.acc.currency)).pipe(map((expenses: CategorySum[]) => (Object.values(expenses.reduce((a: any, e) => {
    const key = e.category?.id || 0;
    const s = a[key] || { category: {...e.category, id: key<3 ? -key : key, fullname: key<3 ? "No Category" : e.category?.fullname}, amounts: [] };
    s.amounts.push({ value: e.amount, currency: e.currency });
    a[key] = s;
    return a;
  }, {})) as any[]).sort((a,b)=>a.category.fullname.localeCompare(b.category.fullname))));

  constructor(private store: Store) { }

  setCategory(category: Category) {
    this.store.dispatch(new SetCategory(category));
  }
}
