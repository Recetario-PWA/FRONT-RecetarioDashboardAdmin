import { Injectable, NgZone } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { Auth } from './auth';
import { UsersService } from './users';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';
import { take, timeout } from 'rxjs';
import { roleRequest } from '../stores/users.store';

@Injectable({
  providedIn: 'root'
})
export class Notifications {
  private echo!: Echo<any>;
  private echoInitialized = false;

  constructor(private userService: UsersService, private authService: Auth, private zone: NgZone) {}

  public subscribeToUserNotifications() {

    const token = this.authService.getToken();

    if (!this.echoInitialized) {
      (window as any).Pusher = Pusher;

      this.echo = new Echo({
        broadcaster: 'pusher',
        key: environment.pusher.key,
        cluster: 'us2',
        forceTLS: true,
        authEndpoint: `${environment.apiUrlBase}broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      });

      this.echoInitialized = true;
  }

    //ESTO NOMAS ES PARA DEPURAR
   /* if (this.echo && this.echo.connector) {
      const pusher = (this.echo.connector as any).pusher;

      pusher.connection.bind('state_change', (states: any) => {
        console.log('Pusher state change:', states);
      });

      pusher.bind('pusher:subscription_error', (status: number, data: any) => {
        console.log('Pusher subscription error:', status, data);
      });

      (pusher as any).logToConsole = true;
    } */

    this.echo.private(`admin-channel`).listen('.new-request-rol', async (event: any) => {
      this.zone.run(() => {
        //console.log('📩 Evento recibido desde Pusher:', event);
        this.userService.getNotifications();
        this.getAllRequest();
        const message = `${event.user.user_name} solicito cambio de rol "${event.comment}"`;
        this.mostrarNotificacion(message);
      });
    });
  }

  private mostrarNotificacion(message: string) {
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      icon: 'info',
      title: message,
      showConfirmButton: false,
      timer: 6000,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });
  }

  getAllRequest() {
    this.userService.getAllRolRequest().pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          roleRequest.set(response.data);
        } else {
          roleRequest.set([]);
        }
      },
      error: (error) => {
        roleRequest.set([]);
        console.log(error);
      }
    });
  }
}
