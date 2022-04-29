import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxsModule } from '@ngxs/store';
import { TransactionDlgComponent } from './transaction-dlg.component';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

describe('TransactionDlgComponent', () => {
  let component: TransactionDlgComponent;
  let fixture: ComponentFixture<TransactionDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgxsModule.forRoot([])],
      declarations: [ TransactionDlgComponent ],
      providers: [
        { provide: POLYMORPHEUS_CONTEXT, useValue: {} }
      ]
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
