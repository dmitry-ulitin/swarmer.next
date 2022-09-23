import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Router } from '@angular/router';
import { TuiAlertService, TuiNotification } from '@taiga-ui/core';

export class AppLogin {
    static readonly type = '[App] Login';
    constructor(public username: string, public password: string, public returnUrl: string) { }
}

export class AppLoginSuccess {
    static readonly type = '[App] Login Success';
}

export class AppLogout {
    static readonly type = '[App] Logout';
}

export class AppPrintError {
    static readonly type = '[App] Print Error';
    constructor(public error: any) { }
}

export class AppPrintSuccess {
    static readonly type = '[App] Print Success';
    constructor(public message: string) { }
}

export interface AppStateModel {
    token: string | null;
    username: string | null;
}

@State<AppStateModel>({
    name: 'app',
    defaults: {
        token: null,
        username: null
    }
})
@Injectable()
export class AppState {
    constructor(private http: HttpClient, private router: Router, private zone: NgZone, private readonly alertService: TuiAlertService) { }

    @Action(AppLogin, { cancelUncompleted: true })
    async appLogin(cxt: StateContext<AppStateModel>, action: AppLogin) {
        try {
            const response = await this.http.post<any>('/api/login', { username: action.username, password: action.password }).toPromise();
            if (!response?.access_token) {
                throw new Error('Incorrect username or password');
            }
            cxt.setState({ token: response.access_token, username: action.username });
            this.zone.run(() => this.router.navigate([action.returnUrl || '']));
            cxt.dispatch(new AppLoginSuccess());
        } catch (err) {
            cxt.dispatch(new AppPrintError(err));
        }
    }

    @Action(AppLogout)
    appLogout(cxt: StateContext<AppStateModel>) {
        if (cxt.getState().token) {
            cxt.setState({ token: null, username: null });
            location.reload();
        }
    }

    @Action(AppPrintSuccess)
    appPrintSuccess(action: AppPrintSuccess) {
        this.zone.run(() => this.alertService.open(action.message).subscribe());
    }

    @Action(AppPrintError)
    appPrintError(cxt: StateContext<AppStateModel>, action: AppPrintError) {
        const statusText: { [id: string]: string } = { 403: 'Forbidden', 500: 'Internal Server Error' };
        const message = statusText[action.error?.status] || action.error?.statusText || action.error?.message || action.error;
        this.zone.run(() => this.alertService.open(message, { status: TuiNotification.Error}).subscribe());
    }

    @Selector()
    static isAuthenticated(state: AppStateModel): boolean {
        return !!state.token;
    }

    @Selector()
    static token(state: AppStateModel): string | null {
        return state.token;
    }

    @Selector()
    static claims(state: AppStateModel): any {
        if (!state.token) {
            return undefined;
        }
        const base64Url = state.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    }
}
