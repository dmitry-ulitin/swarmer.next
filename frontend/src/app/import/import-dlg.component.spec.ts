import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportDlgComponent } from './import-dlg.component';

describe('ImportDlgComponent', () => {
  let component: ImportDlgComponent;
  let fixture: ComponentFixture<ImportDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportDlgComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
