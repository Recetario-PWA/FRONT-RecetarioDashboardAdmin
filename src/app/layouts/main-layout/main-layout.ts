import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, signal, ViewChild } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { currentUser, hasUnreadNotifications, notificationsAdmin, unreadNotifications } from '../../core/stores/auth.store';
import { Auth } from '../../core/services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import Swal from 'sweetalert2';
import { TimeAgoPipe } from '../../core/pipes/time-ago-pipe';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterModule, TimeAgoPipe],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  standalone: true,
})
export class MainLayout {
  fechaHoy: string = '';
  unreadNotis = computed(() => hasUnreadNotifications());
  saludo: string = '';
  isOpenNotifications = signal(false);
  isOpenProfile = signal(false);
  user = computed(() => currentUser());
  notis = computed(() => unreadNotifications());

  @ViewChild('notificationsContainer') notificationsContainer!: ElementRef;
  @ViewChild('profileContainer') profileContainer!: ElementRef;

  constructor(private authService: Auth, private router: Router) {}

  ngOnInit() {
    const hoy = new Date();
    
    const fecha = hoy.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const fechaCompleta = fecha.replace(/\sde\s/g, ' ');
    this.fechaHoy = this.capitalizar(fechaCompleta);

    const hora = hoy.getHours();

    if (hora >= 5 && hora < 12) {
      this.saludo = 'Buenos días';
    } else if (hora >= 12 && hora < 19) {
      this.saludo = 'Buenas tardes';
    } else {
      this.saludo = 'Buenas noches';
    }
  }

  capitalizar(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  toggleNotifications(): void {
    this.isOpenProfile.set(false);
    this.isOpenNotifications.set(!this.isOpenNotifications());
  }

    toggleProfile(): void {
    this.isOpenNotifications.set(false);
    this.isOpenProfile.set(!this.isOpenProfile());
  }

  closeAllMenus(): void {
    this.isOpenNotifications.set(false);
    this.isOpenProfile.set(false);
  }

  closeMenu(): void {
    this.closeAllMenus();
  }

  @HostListener('document:click', ['$event']) onClickOutside(event: MouseEvent) {
    if (!this.isOpenNotifications() && !this.isOpenProfile()) {
      return;
    }

    const clickedElement = event.target as HTMLElement;
    let isClickInsideNotifications = false;

    if (this.notificationsContainer) {
      isClickInsideNotifications = this.notificationsContainer.nativeElement.contains(clickedElement);
    }

    let isClickInsideProfile = false;

    if (this.profileContainer) {
      isClickInsideProfile = this.profileContainer.nativeElement.contains(clickedElement);
    }
        
    if (!isClickInsideNotifications && !isClickInsideProfile) {
      this.closeAllMenus();
    }
  }

  logout() {
    this.closeAllMenus();
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error: HttpErrorResponse | TimeoutError | Error) => {
        if (error instanceof TimeoutError) {
          this.logout();
          return;
        }

        let msg = 'Ha ocurrido un error inesperado';
        if (error instanceof HttpErrorResponse) {
            msg = error.error?.msg || msg;
        } else if (error instanceof Error) {
            msg = error.message;
        }

        Swal.fire({
            title: "Error",
            text: msg,
            icon: "error",
            confirmButtonColor: "#a2aadb"
        });
 
        console.log(error);
      }
    });
  }
}
