import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '@ngxs/store';
import { AppState } from '../app.state';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private store: Store) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.store.selectSnapshot(AppState.token);
        if (token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}` // eslint-disable-line @typescript-eslint/naming-convention
                }
            });
        }
        return next.handle(request);
    }
}
