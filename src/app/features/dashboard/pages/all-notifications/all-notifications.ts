import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { hasUnreadNotifications, notificationsAdmin } from '../../../../core/stores/auth.store';
import { TimeAgoPipe } from '../../../../core/pipes/time-ago-pipe';
import { UsersService } from '../../../../core/services/users';

@Component({
  selector: 'app-all-notifications',
  imports: [CommonModule, RouterModule, TimeAgoPipe],
  templateUrl: './all-notifications.html',
  styleUrl: './all-notifications.css',
  standalone: true,
})
export class AllNotifications {
  notis = computed(() => notificationsAdmin());
  loadingMarkAll = signal(false);

  constructor(private userService: UsersService) {}

  ngOnInit(): void {}

  markAllAsRead() {
    this.loadingMarkAll.set(true);

    this.userService.markAllAsRead().subscribe({
      next: () => {
        this.userService.getNotifications();
        hasUnreadNotifications.set(false);
      },
      error: (error) => {
        console.log(error);
      },
      complete: () => {
        this.loadingMarkAll.set(false);
        hasUnreadNotifications.set(false);
      }
    });
  }
  
  markAsRead(noti: any) {
    if (!noti.read_at) {
        this.userService.markAsRead(noti).subscribe({
          next: () => {
            this.userService.getNotifications();
          },
          error: (error) => {
            console.error(error);
          }
      });
    }
  }
}
