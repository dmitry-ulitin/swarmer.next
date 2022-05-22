import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationDlgComponent } from './confirmation-dlg.component';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

describe('ConfirmationDlgComponent', () => {
  let component: ConfirmationDlgComponent;
  let fixture: ComponentFixture<ConfirmationDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmationDlgComponent ],
      providers: [
        { provide: POLYMORPHEUS_CONTEXT, useValue: {} }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
