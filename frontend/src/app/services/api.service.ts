import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TuiDay } from '@taiga-ui/cdk';
import { Observable } from 'rxjs';
import { Category } from '../models/category';
import { CategorySum } from '../models/category-sum';
import { DateRange } from '../models/date-range';
import { Group } from '../models/group';
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

  getTransactions(accounts: number[], search: string, range: DateRange, offset: number, limit: number): Observable<Transaction[]> {
    let params = new HttpParams();
    params = params.set('accounts', accounts.join(","));
    params = params.set('search', search);
    params = params.set('from', range?.from?.toString('YMD','-'));
    params = params.set('to', range?.to?.daySame(TuiDay.currentLocal())? '' : range?.to?.toString('YMD','-'));
    params = params.set('offset', offset);
    params = params.set('limit', limit);
    return this.http.get<Transaction[]>('/api/transactions', {params: params});
  }

  getSummary(accounts: number[], range: DateRange): Observable<Summary[]> {
    let params = new HttpParams();
    params = params.set('accounts', accounts.join(","));
    params = params.set('from', range?.from?.toString('YMD','-'));
    params = params.set('to', range?.to?.daySame(TuiDay.currentLocal())? '' : range?.to?.toString('YMD','-'));
    return this.http.get<Summary[]>('/api/transactions/summary', {params: params});
  }

  getExpences(accounts: number[], range: DateRange): Observable<CategorySum[]> {
    let params = new HttpParams();
    params = params.set('accounts', accounts.join(","));
    params = params.set('from', range?.from?.toString('YMD','-'));
    params = params.set('to', range?.to?.daySame(TuiDay.currentLocal())? '' : range?.to?.toString('YMD','-'));
    return this.http.get<CategorySum[]>('/api/transactions/expences', {params: params});
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

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories');
  }
}
