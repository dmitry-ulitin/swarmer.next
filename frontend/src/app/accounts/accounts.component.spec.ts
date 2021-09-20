import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';

import { AccountsComponent } from './accounts.component';

describe('AccountsComponent', () => {
  const storeSpy = jasmine.createSpyObj('Store',['dispatch','select']);
  let component: AccountsComponent;
  let fixture: ComponentFixture<AccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccountsComponent ],
      providers: [ { provide: Store, useValue: storeSpy } ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    storeSpy.select.and.returnValue(of(null));
    fixture = TestBed.createComponent(AccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
