import { Component, ComponentFactoryResolver, ViewChild, OnDestroy } from "@angular/core";
import { NgForm } from "@angular/forms";
import { AuthService, AuthResponseData } from "./auth.service";
import { Observable, Subscription } from "rxjs";
import { Router } from "@angular/router";
import { AlertComponent } from "../shared/alert/alert.component";
import { PlaceholderDirective } from "../shared/placeholder/placeholder.directive";

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html'
})
export class AuthComponent implements OnDestroy {
    isLoginMode = true;
    isLoading = false;
    error:string = null;
    @ViewChild(PlaceholderDirective, {static: false}) alertHost: PlaceholderDirective;
    private closeSub:Subscription;
    constructor(private authService:AuthService, private router:Router,
                private componentFactoryResolver:ComponentFactoryResolver) {}

    onSwitchMode() {
        this.isLoginMode = !this.isLoginMode;
    }

    onSubmit(form:NgForm) {
        if (!form.valid){
            return;
        }
        let authObs: Observable<AuthResponseData>;
        const email = form.value.email;
        const password = form.value.password;
        this.isLoading = true;
        
        if (this.isLoginMode) {
            authObs = this.authService.login(email, password);
        } else {
            authObs = this.authService.signUp(email, password);
            
        }
        authObs.subscribe(response => {
            this.isLoading = false;
            this.router.navigate(['/recipes']);
        }, error => {
            this.error = error;
            this.showErrorAlert(error);
            this.isLoading = false;
        });
        form.reset();

  
    }

    onHandleError() {
        this.error = null;
    }

    showErrorAlert(message:string) {
        const alertComponent = this.componentFactoryResolver.resolveComponentFactory(
            AlertComponent
        );
        const hostViewContainerRef = this.alertHost.viewContainerRef;
        hostViewContainerRef.clear();
        const componentRef = hostViewContainerRef.createComponent(alertComponent);
        componentRef.instance.message = message;
        this.closeSub = componentRef.instance.close.subscribe(() => {
            this.closeSub.unsubscribe();
            hostViewContainerRef.clear();
        });
    }

    ngOnDestroy() {
        if (this.closeSub) {
            this.closeSub.unsubscribe();
        }
    }

}