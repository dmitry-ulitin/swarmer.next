import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AppRegistration } from '../app.state';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationComponent {
  form = new FormGroup({
    email: new FormControl(''),
    name: new FormControl(''),
    currency: new FormControl(''),
    password: new FormControl('')
  });

  get defaultName(): string {
    return this.form.value.email?.replace(/@.*/, '') || 'Enter your name';
  }

  constructor(private store: Store) { }

  submit(): void {
    this.store.dispatch(new AppRegistration({...this.form.value, name: this.form.value.name || this.defaultName}));
  }
}
