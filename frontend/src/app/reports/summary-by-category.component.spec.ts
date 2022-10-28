import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryByCategoryComponent } from './summary-by-category.component';

describe('SummaryByCategoryComponent', () => {
  let component: SummaryByCategoryComponent;
  let fixture: ComponentFixture<SummaryByCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SummaryByCategoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryByCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
