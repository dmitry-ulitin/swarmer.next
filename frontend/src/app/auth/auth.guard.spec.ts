import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const storeSpy = jasmine.createSpyObj('Store',['dispatch','select']);
  const routerSpy = jasmine.createSpyObj('Router',['navigate']);
  let guard: AuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [ { provide: Store, useValue: storeSpy }, { provide: Router, useValue: routerSpy } ]});
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
