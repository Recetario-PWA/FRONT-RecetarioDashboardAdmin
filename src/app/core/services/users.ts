import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { hasUnreadNotifications, notificationsAdmin, notificationsLoading, unreadNotifications } from '../stores/auth.store';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private baseUrl: string;
  private baserNotificationsUrl: string;

  constructor (private http: HttpClient) {
    this.baseUrl = `${environment.apiUrlBase}user/`;
    this.baserNotificationsUrl = `${environment.apiUrlBase}notifications`;
  }

  getAllUsers(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  getAllRolRequest(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}all-requests`);
  }

  updateRole(id: any, status: boolean): Observable<any> {
    return this.http.post(`${this.baseUrl}role-update/${id}`, { status: status });
  }

  updateUser(data: any):  Observable<any> {
    return this.http.put(`${this.baseUrl}`, data);
  }

  getNotifications() {
    notificationsLoading.set(true);
    this.http.get<any>(`${this.baserNotificationsUrl}`).subscribe({
      next: (response) => {
        if (response.data) {
         let allNotis = response.data;

          const pendingRequests = allNotis.filter((request: any) => 
            request.data.type === 'ROL'
          );

          const unReadNotis = pendingRequests.filter((unread: any) => 
            unread.read_at === null
          );
          
          unreadNotifications.set(unReadNotis);

          const unreadNotisArray = unreadNotifications();

          if (unreadNotisArray && unreadNotisArray.length > 0) {
            hasUnreadNotifications.set(true);
          } else {
            hasUnreadNotifications.set(false);
          }
          
          notificationsAdmin.set(pendingRequests);
          notificationsLoading.set(false);
        } else {
          notificationsAdmin.set(null);
          notificationsLoading.set(false);
        }
      },
      error: (error) => {
        notificationsAdmin.set(null);
        notificationsLoading.set(false);
      }
    });
  }

  markAsRead(id: string): Observable<any> {
    return this.http.post(`${environment.apiUrlBase}notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.post(`${environment.apiUrlBase}notifications/read-all`, {});
  }
}
