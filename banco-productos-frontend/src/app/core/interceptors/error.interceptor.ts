import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error) => {
      // La verificación del ID muestra el error junto al campo del formulario.
      if (!req.url.includes('/verification/')) {
        const msg = error?.error?.message || 'Error de conexión con el servidor local (Puerto 3002).';
        notificationService.showError(msg);
      }
      return throwError(() => error);
    })
  );
};