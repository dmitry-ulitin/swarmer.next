import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category } from '../models/category';
import { Group } from '../models/group';
import { Transaction } from '../models/transaction';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>('/api/groups/');
  }

  getGroup(id: number): Observable<Group> {
    return this.http.get<Group>(`/api/groups/${id}`);
  }

  saveGroup(group: Group): Observable<Group> {
    return !!group.id ? this.http.put<Group>('/api/groups/', group) : this.http.post<Group>('/api/groups/', group);
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`/api/groups/${id}`);
  }

  getTransactions(accounts: number[]): Observable<Transaction[]> {
    let params = new HttpParams();
    params = params.set('accounts', accounts.join(","));
    return this.http.get<Transaction[]>('/api/transactions/', {params: params});
  }

  getTransaction(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`/api/transactions/${id}`);
  }

  saveTransaction(transaction: Transaction): Observable<Transaction> {
    return !!transaction.id ? this.http.put<Transaction>('/api/transactions/', transaction) : this.http.post<Transaction>('/api/transactions/', transaction);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`/api/transactions/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories/');
  }
}
