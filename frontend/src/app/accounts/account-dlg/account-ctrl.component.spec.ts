import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { AccountCtrlComponent } from './account-ctrl.component';

describe('AccountCtrlComponent', () => {
  const storeSpy = jasmine.createSpyObj('Store',['dispatch','select','selectSnapshot']);
  let component: AccountCtrlComponent;
  let fixture: ComponentFixture<AccountCtrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccountCtrlComponent ],
      providers: [ { provide: Store, useValue: storeSpy } ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    storeSpy.select.and.returnValue(of(null));
    storeSpy.selectSnapshot.and.returnValue(of(null));
    fixture = TestBed.createComponent(AccountCtrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
