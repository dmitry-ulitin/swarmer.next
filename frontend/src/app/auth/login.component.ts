import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { AppLogin } from '../app.state';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  form: UntypedFormGroup = new UntypedFormGroup({
    username: new UntypedFormControl(''),
    password: new UntypedFormControl('')
  });
  returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

  constructor(private store: Store, private route: ActivatedRoute) { }

  submit(): void {
    this.store.dispatch(new AppLogin(this.form.controls['username'].value, this.form.controls['password'].value, this.returnUrl));
  }
}
