import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { AccountDialogComponent } from './account-dlg.component';

describe('AccountDialogComponent', () => {
  const storeSpy = jasmine.createSpyObj('Store',['dispatch','select']);
  let component: AccountDialogComponent;
  let fixture: ComponentFixture<AccountDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccountDialogComponent ],
      providers: [ { provide: Store, useValue: storeSpy } ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    storeSpy.select.and.returnValue(of(null));
    fixture = TestBed.createComponent(AccountDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
