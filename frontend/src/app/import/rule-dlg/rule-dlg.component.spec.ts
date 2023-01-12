import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleDlgComponent } from './rule-dlg.component';

describe('RuleDlgComponent', () => {
  let component: RuleDlgComponent;
  let fixture: ComponentFixture<RuleDlgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RuleDlgComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RuleDlgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
