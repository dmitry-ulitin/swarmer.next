import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadDumpDlgComponent } from './load-dump-dlg.component';

describe('InputFileDlgComponent', () => {
  let component: LoadDumpDlgComponent;
  let fixture: ComponentFixture<LoadDumpDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadDumpDlgComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadDumpDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
