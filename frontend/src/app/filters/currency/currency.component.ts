import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { TuiHostedDropdownComponent, TUI_ICONS_PATH } from '@taiga-ui/core';
import { AccState, SetCurrency } from 'src/app/accounts/accounts.state';

const MAPPER: Record<string, string> = {
  tuiIconCollapse: 'monetization_on_24'
};

export function iconsPath(name: string): string {
  return MAPPER[name] ? `assets/icons/${MAPPER[name]}.svg#${MAPPER[name]}` : `assets/taiga-ui/icons/${name}.svg#${name}`;
}

@Component({
  selector: 'app-currency',
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TUI_ICONS_PATH,
      useValue: iconsPath,
    },
  ]
})
export class CurrencyComponent {
  @ViewChild(TuiHostedDropdownComponent) component?: TuiHostedDropdownComponent;
  currencies$ = this.store.select(AccState.summaryCurrencies);
  value$ = this.store.select(state => state.acc.currency);;
  open = false;

  constructor(private store: Store) { }

  onClick(option: string | null) {
    this.open = false;
    this.component?.nativeFocusableElement?.focus();
    this.store.dispatch(new SetCurrency(option));
  }
}
