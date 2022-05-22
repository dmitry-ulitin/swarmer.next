import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputFileDlgComponent } from './input-file-dlg.component';

describe('InputFileDlgComponent', () => {
  let component: InputFileDlgComponent;
  let fixture: ComponentFixture<InputFileDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputFileDlgComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputFileDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
