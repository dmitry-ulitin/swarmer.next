import { BrowserModule } from '@angular/platform-browser';
import { LOCALE_ID, NgModule } from '@angular/core';

import { AppRoutingModule } from './app.routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './auth/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';
import { NgxsModule } from '@ngxs/store';
import { AppState } from './app.state';
import { AccountsComponent } from './accounts/accounts.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './auth/jwt.interceptor';
import { ErrorInterceptor } from './auth/error.interceptor';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { AccState } from './accounts/accounts.state';

import localeRu from '@angular/common/locales/ru';
import { registerLocaleData } from '@angular/common';
import { TransactionsComponent } from './transactions/transactions.component';
import { HomeComponent } from './home/home.component';
import { SummaryComponent } from './reports/summary.component';
import { TuiButtonModule, TuiLinkModule, TuiDataListModule, TuiGroupModule, TuiHostedDropdownModule, TuiModeModule, TuiAlertModule, TuiRootModule, TuiSvgModule, TuiDialogModule, TuiLabelModule, TuiTextfieldControllerModule, TuiPrimitiveTextfieldModule, TuiErrorModule } from '@taiga-ui/core';
import { TuiDataListWrapperModule, TuiInputModule, TuiInputNumberModule, TuiInputPasswordModule, TuiSelectModule, TuiComboBoxModule, TuiFilterByInputPipeModule, TuiInputDateModule, TuiTextAreaModule, TuiInputFilesModule, TuiFilesModule, TuiTagModule } from '@taiga-ui/kit';
import { NgxsSelectSnapshotModule } from '@ngxs-labs/select-snapshot';
import { TransactionDlgComponent } from './transactions/transaction-dlg/transaction-dlg.component';
import { TransactionCtrlComponent } from './transactions/transaction-dlg/transaction-ctrl.component';
import { ConfirmationDlgComponent } from './confirmation/confirmation-dlg.component';
import { AccountCtrlComponent } from './accounts/account-dlg/account-ctrl.component';
import { AccountDialogComponent } from './accounts/account-dlg/account-dlg.component';
import { InputFileDlgComponent } from './import/input-file-dlg.component';
import { ImportDlgComponent } from './import/import-dlg.component';
import { TuiTableModule } from '@taiga-ui/addon-table';
import { TuiFilterPipeModule, TuiLetModule } from '@taiga-ui/cdk';
import { FiltersComponent } from './filters/filters.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { CategoryCtrlComponent } from './transactions/transaction-dlg/category-ctrl/category-ctrl.component';
import { RegistrationComponent } from './auth/registration.component';
import { RangeComponent } from './filters/range/range.component';
import { SummaryByCategoryComponent } from './reports/summary-by-category.component';
import { RuleDlgComponent } from './import/rule-dlg/rule-dlg.component';
registerLocaleData(localeRu, 'ru');

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HeaderComponent,
    AccountsComponent,
    AccountCtrlComponent,
    AccountDialogComponent,
    TransactionsComponent,
    HomeComponent,
    TransactionCtrlComponent,
    TransactionDlgComponent,
    ConfirmationDlgComponent,
    InputFileDlgComponent,
    ImportDlgComponent,
    SummaryComponent,
    FiltersComponent,
    CategoryCtrlComponent,
    RegistrationComponent,
    RangeComponent,
    SummaryByCategoryComponent,
    RuleDlgComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    InfiniteScrollModule,
    TuiRootModule,
    TuiModeModule,
    TuiButtonModule,
    TuiLabelModule,
    TuiInputModule,
    TuiInputPasswordModule,
    TuiInputNumberModule,
    TuiInputDateModule,
    TuiInputFilesModule,
    TuiErrorModule,
    TuiFilesModule,
    TuiTextfieldControllerModule,
    TuiTextAreaModule,
    TuiHostedDropdownModule,
    TuiComboBoxModule,
    TuiSelectModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    TuiSvgModule,
    TuiAlertModule,
    TuiGroupModule,
    TuiLinkModule,
    TuiTagModule,
    TuiDialogModule,
    TuiFilterByInputPipeModule,
    TuiFilterPipeModule,
    TuiPrimitiveTextfieldModule,
    TuiTableModule,
    TuiLetModule,
    
    NgxsModule.forRoot([AppState, AccState]),
    NgxsStoragePluginModule.forRoot({ key: 'app.token' }),
    NgxsSelectSnapshotModule.forRoot()
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'ru' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
