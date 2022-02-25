import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionCtrlComponent } from './transaction-ctrl.component';

describe('TransactionCtrlComponent', () => {
  let component: TransactionCtrlComponent;
  let fixture: ComponentFixture<TransactionCtrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransactionCtrlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionCtrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
