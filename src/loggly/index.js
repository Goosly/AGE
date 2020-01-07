import * as tslib_1 from "tslib";
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogglyService } from './loggly.service';
import { HttpClientModule } from '@angular/common/http';
export * from './loggly.service';
var NgxLogglyModule = /** @class */ (function () {
    function NgxLogglyModule() {
    }
    NgxLogglyModule_1 = NgxLogglyModule;
    NgxLogglyModule.forRoot = function () {
        return {
            ngModule: NgxLogglyModule_1,
            providers: [LogglyService]
        };
    };
    var NgxLogglyModule_1;
    NgxLogglyModule = NgxLogglyModule_1 = tslib_1.__decorate([
        NgModule({
            imports: [
                CommonModule,
                HttpClientModule
            ],
            declarations: [],
            exports: []
        })
    ], NgxLogglyModule);
    return NgxLogglyModule;
}());
export { NgxLogglyModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtbG9nZ2x5LWxvZ2dlci8iLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsUUFBUSxFQUF1QixNQUFNLGVBQWUsQ0FBQztBQUM5RCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDL0MsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBRXhELGNBQWMsa0JBQWtCLENBQUM7QUFVakM7SUFBQTtJQU9BLENBQUM7d0JBUFksZUFBZTtJQUNuQix1QkFBTyxHQUFkO1FBQ0UsT0FBTztZQUNMLFFBQVEsRUFBRSxpQkFBZTtZQUN6QixTQUFTLEVBQUUsQ0FBQyxhQUFhLENBQUM7U0FDM0IsQ0FBQztJQUNKLENBQUM7O0lBTlUsZUFBZTtRQVIzQixRQUFRLENBQUM7WUFDUixPQUFPLEVBQUU7Z0JBQ1AsWUFBWTtnQkFDWixnQkFBZ0I7YUFDakI7WUFDRCxZQUFZLEVBQUUsRUFBRTtZQUNoQixPQUFPLEVBQUUsRUFBRTtTQUNaLENBQUM7T0FDVyxlQUFlLENBTzNCO0lBQUQsc0JBQUM7Q0FBQSxBQVBELElBT0M7U0FQWSxlQUFlIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmdNb2R1bGUsIE1vZHVsZVdpdGhQcm92aWRlcnMgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBMb2dnbHlTZXJ2aWNlIH0gZnJvbSAnLi9sb2dnbHkuc2VydmljZSc7XG5pbXBvcnQgeyBIdHRwQ2xpZW50TW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uL2h0dHAnO1xuXG5leHBvcnQgKiBmcm9tICcuL2xvZ2dseS5zZXJ2aWNlJztcblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW1xuICAgIENvbW1vbk1vZHVsZSxcbiAgICBIdHRwQ2xpZW50TW9kdWxlXG4gIF0sXG4gIGRlY2xhcmF0aW9uczogW10sXG4gIGV4cG9ydHM6IFtdXG59KVxuZXhwb3J0IGNsYXNzIE5neExvZ2dseU1vZHVsZSB7XG4gIHN0YXRpYyBmb3JSb290KCk6IE1vZHVsZVdpdGhQcm92aWRlcnMge1xuICAgIHJldHVybiB7XG4gICAgICBuZ01vZHVsZTogTmd4TG9nZ2x5TW9kdWxlLFxuICAgICAgcHJvdmlkZXJzOiBbTG9nZ2x5U2VydmljZV1cbiAgICB9O1xuICB9XG59XG4iXX0=