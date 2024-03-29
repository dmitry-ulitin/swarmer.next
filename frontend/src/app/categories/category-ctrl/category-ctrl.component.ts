import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, Optional, Self, ViewChild } from '@angular/core';
import { NgControl } from '@angular/forms';
import { AbstractTuiControl, TuiNativeFocusableElement } from '@taiga-ui/cdk';
import { TuiPrimitiveTextfieldComponent } from '@taiga-ui/core';

@Component({
  selector: 'app-category-ctrl',
  templateUrl: './category-ctrl.component.html',
  styleUrls: ['./category-ctrl.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryCtrlComponent extends AbstractTuiControl<string> {
  @ViewChild(TuiPrimitiveTextfieldComponent)
  private readonly textfield?: TuiPrimitiveTextfieldComponent;
  @Input() prefix = '';

  constructor(
    @Optional()
    @Self()
    @Inject(NgControl)
    control: NgControl | null,
    @Inject(ChangeDetectorRef) changeDetectorRef: ChangeDetectorRef,
  ) {
    super(control, changeDetectorRef);
  }

  get nativeFocusableElement(): TuiNativeFocusableElement | null {
    return this.computedDisabled || !this.textfield
      ? null
      : this.textfield.nativeFocusableElement;
  }

  get focused(): boolean {
    return !!this.textfield && this.textfield.focused;
  }

  onValueChange(textValue: string): void {
    this.updateValue(textValue);
  }

  onFocused(focused: boolean): void {
    this.updateFocused(focused);
  }

  protected getFallbackValue(): string {
    return ``;
  }
}
