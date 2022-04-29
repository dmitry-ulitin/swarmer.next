import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxsModule } from '@ngxs/store';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

import { TransactionCtrlComponent } from './transaction-ctrl.component';

describe('TransactionCtrlComponent', () => {
  let component: TransactionCtrlComponent;
  let fixture: ComponentFixture<TransactionCtrlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([])],
      declarations: [ TransactionCtrlComponent ],
      providers: [
        { provide: POLYMORPHEUS_CONTEXT, useValue: {} }
      ]
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
