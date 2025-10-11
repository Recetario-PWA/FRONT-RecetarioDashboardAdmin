import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, signal, ViewChild } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  standalone: true,
})
export class MainLayout {
  fechaHoy: string = '';
  saludo: string = '';
  isOpenNotifications = signal(false);
  isOpenProfile = signal(false);

  @ViewChild('notificationsContainer') notificationsContainer!: ElementRef;
  @ViewChild('profileContainer') profileContainer!: ElementRef;

  constructor() {}

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

  logout(): void {
    this.closeAllMenus();
  }
}
