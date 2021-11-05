import { TestBed } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AccState, GetGroups, GetTransactions, SelectAccounts, ToggleGropup } from './accounts.state';

export const TEST_STATE = {
  groups: [{ id: 1, accounts: [], name: "cash" }, { id: 2, accounts: [], name: "card" }],
  expanded: [2],
  accounts: [],
  transactions: []
};

describe('AccState', () => {
  let store: Store;
  const apiSpy = jasmine.createSpyObj('ApiService', ['getGroups', 'getTransactions']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([AccState])],
      providers: [{ provide: ApiService, useValue: apiSpy }]
    });
    store = TestBed.inject(Store);
    store.reset({
      ...store.snapshot(),
      acc: TEST_STATE
    });
  });

  it('it loads account groups', async () => {
    apiSpy.getGroups.and.returnValue(of([{ id: 1, accounts: [], name: "cash" }]));
    await store.dispatch(new GetGroups()).toPromise();
    const groups = store.selectSnapshot(state => state.acc.groups);
    expect(groups.length).toBe(1);
  });

  it('it expands group', () => {
    store.dispatch(new ToggleGropup(1));
    const expanded = store.selectSnapshot(state => state.acc.expanded);
    expect(expanded.length).toBe(2);
    expect(expanded.includes(1)).toBeTruthy();
    expect(expanded.includes(2)).toBeTruthy();
  });

  it('it collapse group', () => {
    store.dispatch(new ToggleGropup(2));
    const expanded = store.selectSnapshot(state => state.acc.expanded);
    expect(expanded.length).toBe(0);
  });

  it('it changes account selection', () => {
    store.dispatch(new SelectAccounts([1, 2]));
    const accounts = store.selectSnapshot(state => state.acc.accounts);
    expect(accounts.length === 2 && accounts[0] === 1 && accounts[1] === 2).toBeTruthy();
  });

  it('it loads transactions', async () => {
    apiSpy.getTransactions.and.returnValue(of([
      {
        "id": 3960,
        "account": { "id": 42, "balance": 55630, "currency": "EUR", "fullname": "modulbank EUR" },
        "recipient": { "id": 43, "balance": 4794.5, "currency": "RUB", "fullname": "modulbank RUB" },
        "credit": 50,
        "currency": null,
        "debit": 4420.5,
        "opdate": "2021-03-04T13:22:53.854000",
        "type": 0
      },
      {
        "id": 3959,
        "recipient": { "id": 42, "balance": 55680, "currency": "EUR", "fullname": "modulbank EUR" },
        "category": { "id": 201, "name": "Salary" },
        "credit": 8000,
        "currency": "EUR",
        "debit": 8000,
        "opdate": "2021-03-04T13:21:23.642000",
        "type": 2
      },
      {
        "id": 3958,
        "account": { "id": 43, "balance": 374, "currency": "RUB", "fullname": "modulbank RUB" },
        "category": { "id": 108, "name": "Bills" },
        "credit": 1000,
        "currency": "RUB",
        "debit": 1000,
        "details": null,
        "opdate": "2021-03-04T13:21:01.313000",
        "type": 1
      }
    ]));
    await store.dispatch(new GetTransactions()).toPromise();
    const transactions = store.selectSnapshot(state => state.acc.transactions);
    expect(transactions.length).toBe(3);
    expect(transactions[0].name).toBe("modulbank EUR => modulbank RUB");
    expect(transactions[0].amount.value).toBe(50);
    expect(transactions[0].amount.currency).toBe("EUR");
    expect(transactions[1].name).toBe("Salary");
    expect(transactions[1].amount.value).toBe(8000);
    expect(transactions[1].amount.currency).toBe("EUR");
    expect(transactions[2].name).toBe("Bills");
    expect(transactions[2].amount.value).toBe(1000);
    expect(transactions[2].amount.currency).toBe("RUB");
  });
});