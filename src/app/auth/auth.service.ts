import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { catchError, tap } from "rxjs/operators";
import { throwError, BehaviorSubject } from "rxjs";
import { User } from "./user.model";
import { Router } from "@angular/router";

export interface AuthResponseData{
    idToken:string;
    email:string;
    refreshToken:string;
    expiresIn:string;
    localId:string;
    registered?:boolean;
}


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    user = new BehaviorSubject<User>(null);
    private tokenExpirationTimer:any;

    constructor (private http:HttpClient, private router:Router) {}
    urlSignUp = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDH2IPF5mFVMEyLcKPGQIsp2ejHIbOJv9Q'
    signUp(email:string, password:string) {
        return this.http.post<AuthResponseData>(this.urlSignUp, {
            email: email,
            password: password,
            returnSecureToken: true
        }).pipe(catchError(this.handleError), tap(responseData => {
            this.handleAuthentication(
                responseData.email,
                responseData.localId,
                responseData.idToken,
                +responseData.expiresIn
            );
        }));
    }

    logout() {
        this.user.next(null);
        this.router.navigate(['/auth']);
        localStorage.removeItem('userData');
        if (this.tokenExpirationTimer) {
            clearTimeout(this.tokenExpirationTimer);
        }
        this.tokenExpirationTimer = null;
    }

    autoLogout(expirationDuration: number) {
        this.tokenExpirationTimer = setTimeout(() => {
            this.logout();
        }, expirationDuration);
    }

    login(email: string, password: string) {
        const url = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDH2IPF5mFVMEyLcKPGQIsp2ejHIbOJv9Q'
        return this.http.post<AuthResponseData>(url, {
            email: email,
            password: password,
            returnSecureToken: true
        }).pipe(catchError(this.handleError), tap(responseData => {
            this.handleAuthentication(
                responseData.email,
                responseData.localId,
                responseData.idToken,
                +responseData.expiresIn
            );
        }));

    }

    autoLogin() {
        const data:{
            email:string;
            id:string;
            _token:string;
            _tokenExpirationDate:string
        } = JSON.parse(localStorage.getItem('userData'));
        if (!data) {
            return;
        }
        const loadedUser = new User(data.email, data.id, data._token, new Date(data._tokenExpirationDate))
        if (loadedUser.token) {
            this.user.next(loadedUser);
            const expirationDuration = new Date(data._tokenExpirationDate).getTime() - new Date().getTime();
            this.autoLogout(expirationDuration);
        }
    }

    private handleError(errorResponse: HttpErrorResponse){
        let errorMessage = 'An error occurred!';
        if (!errorResponse.error || !errorResponse.error.error) {
            return throwError(errorMessage);
        }
        switch(errorResponse.error.error.message){
            case 'EMAIL_EXISTS':
                errorMessage = 'This email exists already!';
                break;
            case 'EMAIL_NOT_FOUND':
                errorMessage = 'Bad credentials';
                break;
        }
        return throwError(errorMessage);
    }

    private handleAuthentication(email:string, userId:string,
                                 token:string, expiresIn:number) {
        const exprirationDate = new Date(new Date().getTime()
        + expiresIn * 1000);
        const user = new User(email, userId, token, exprirationDate);
        this.user.next(user);
        this.autoLogout(expiresIn * 1000);
        localStorage.setItem('userData', JSON.stringify(user));
    }

}