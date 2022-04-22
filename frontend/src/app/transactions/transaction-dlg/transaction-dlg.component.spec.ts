import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionDlgComponent } from './transaction-dlg.component';

describe('TransactionDlgComponent', () => {
  let component: TransactionDlgComponent;
  let fixture: ComponentFixture<TransactionDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransactionDlgComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
