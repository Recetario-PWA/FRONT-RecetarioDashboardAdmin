import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from './core/services/auth';
import { UsersService } from './core/services/users';
import { Notifications } from './core/services/notifications';
import { PushService } from './core/services/push';
import { userInfoLoading } from './core/stores/auth.store';
import { Spinner } from "./shared/components/spinner/spinner";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, Spinner],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
})
export class App {
  loading = computed(() => userInfoLoading());
  protected readonly title = signal('FRONT-RecetarioDashboardAdmin');

  constructor(private authService: Auth, private userService: UsersService, private notificationService: Notifications, private pushNotifications: PushService) {}

  ngOnInit() {
    console.log(`HOLAAAA (●'◡'●) qué tanto miras aquí???`);
    this.authService.getUserInfo().subscribe(user => {
      if (user?.data?.id) {
        this.pushNotifications.init(user.data.id.toString());
        this.notificationService.subscribeToUserNotifications();
        this.userService.getNotifications();
      }
    });
  }
  
}
