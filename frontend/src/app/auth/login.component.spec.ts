import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  const storeSpy = jasmine.createSpyObj('Store', ['dispatch', 'select']);
  const routeSpy = jasmine.createSpyObj('ActivatedRoute', [], { snapshot: { queryParams: { returnUrl: null } } });
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      providers: [{ provide: Store, useValue: storeSpy }, { provide: ActivatedRoute, useValue: routeSpy }]
    })
      .compileComponents();
  });

  beforeEach(() => {
    storeSpy.select.and.returnValue(of(null));
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
