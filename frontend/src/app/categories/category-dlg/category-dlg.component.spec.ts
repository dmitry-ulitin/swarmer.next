import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryDlgComponent } from './category-dlg.component';

describe('CategoryDlgComponent', () => {
  let component: CategoryDlgComponent;
  let fixture: ComponentFixture<CategoryDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CategoryDlgComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
