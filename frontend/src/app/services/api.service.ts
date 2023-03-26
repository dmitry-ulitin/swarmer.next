import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TuiDay } from '@taiga-ui/cdk';
import { Observable } from 'rxjs';
import { Category } from '../models/category';
import { CategorySum } from '../models/category-sum';
import { DateRange } from '../models/date-range';
import { Group } from '../models/group';
import { Rule } from '../models/rule';
import { Summary } from '../models/summary';
import { Transaction, TransactionImport } from '../models/transaction';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  getGroups(opdate: string): Observable<Group[]> {
    return this.http.get<Group[]>(`/api/groups?opdate=${encodeURIComponent(opdate)}`);
  }

  getGroup(id: number): Observable<Group> {
    return this.http.get<Group>(`/api/groups/${id}`);
  }

  saveGroup(group: Group): Observable<Group> {
    return !!group.id ? this.http.put<Group>('/api/groups', group) : this.http.post<Group>('/api/groups', group);
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`/api/groups/${id}`);
  }

  getTransactions(accounts: number[], search: string, range: DateRange, category: number | undefined | null, currency: string | null, offset: number, limit: number): Observable<Transaction[]> {
    let params = new HttpParams();
    params = params.set('accounts', accounts.join(","));
    params = params.set('search', search);
    params = params.set('category', typeof category === 'number' ? category : '');
    params = params.set('currency', currency || '');
    params = params.set('from', range?.from?.toString('YMD','-') || '');
    params = params.set('to', range?.to?.toString('YMD','-') || '');
    params = params.set('offset', offset);
    params = params.set('limit', limit);
    return this.http.get<Transaction[]>('/api/transactions', {params: params});
  }

  getSummary(accounts: number[], range: DateRange): Observable<Summary[]> {
    let params = new HttpParams();
    params = params.set('accounts', accounts.join(","));
    params = params.set('from', range?.from?.toString('YMD','-') || '');
    params = params.set('to', range?.to?.toString('YMD','-') || '');
    return this.http.get<Summary[]>('/api/transactions/summary', {params: params});
  }

  getExpenses(accounts: number[], range: DateRange): Observable<CategorySum[]> {
    let params = new HttpParams();
    params = params.set('accounts', accounts.join(","));
    params = params.set('from', range?.from?.toString('YMD','-') || '');
    params = params.set('to', range?.to?.toString('YMD','-') || '');
    return this.http.get<CategorySum[]>('/api/transactions/expenses', {params: params});
  }

  getTransaction(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`/api/transactions/${id}`);
  }

  saveTransaction(transaction: Transaction): Observable<Transaction> {
    return !!transaction.id ? this.http.put<Transaction>('/api/transactions', transaction) : this.http.post<Transaction>('/api/transactions', transaction);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`/api/transactions/${id}`);
  }

  importTransactions(acc: number, bank: number, file: File): Observable<TransactionImport[]> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('id', acc.toString());
    formData.append('bank', bank.toString());
    return this.http.post<TransactionImport[]>('/api/transactions/import', formData);
  }

  saveTransactions(acc: number, transactions: TransactionImport[]): Observable<void> {
    return this.http.patch<void>(`/api/transactions/import?account=${acc}`, transactions);
  }

  getRules(): Observable<Rule[]> {
    return this.http.get<Rule[]>('/api/transactions/rules');
  }

  getRule(id: number): Observable<Rule> {
    return this.http.get<Rule>(`/api/transactions/rules/${id}`);
  }

  addRule(rule: Rule): Observable<Rule> {
    return this.http.post<Rule>('/api/transactions/rules', rule);
  }

  updateRule(rule: Rule): Observable<Rule> {
    return this.http.put<Rule>('/api/transactions/rules', rule);
  }

  saveRule(rule: Rule): Observable<Rule> {
    return !!rule.id ? this.updateRule(rule) : this.addRule(rule);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories');
  }

  addCategory(rule: Category): Observable<Category> {
    return this.http.post<Category>('/api/categories', rule);
  }

  updateCategory(rule: Category): Observable<Category> {
    return this.http.put<Category>('/api/categories', rule);
  }

  saveCategory(category: Category): Observable<Category> {
    return !!category.id ? this.addCategory(category) : this.updateCategory(category);
  }

  deleteCategory(id: number, replace: number | null = null): Observable<void> {
    return this.http.delete<void>(`/api/categories/${id}?replace=${replace || ''}`);
  }

  getUsers(query: string): Observable<string[]> {
    let params = new HttpParams();
    params = params.set('query', query);
    return this.http.get<string[]>('/api/groups/users', {params: params});
  }

  getBackup(): Observable<HttpResponse<Blob>> {
    return this.http.get('/api/data/dump', {responseType: 'blob', observe: 'response'});
  }

  loadBackup(blob: any) {
    return this.http.put('/api/data/dump', blob);
  }
}
