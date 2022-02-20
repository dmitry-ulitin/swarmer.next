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

  getTransactions(accounts: number[]): Observable<Transaction[]> {
    let params = new HttpParams();
    params = params.set('accounts', accounts.join(","));
    return this.http.get<Transaction[]>('/api/transactions/', {params: params});
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories/');
  }
}
