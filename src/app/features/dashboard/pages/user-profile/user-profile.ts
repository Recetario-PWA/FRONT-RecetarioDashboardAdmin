import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
  standalone: true,
})
export class UserProfile {
  isModalOpen = signal(false);

  constructor() {}

  ngOnInit() {}

  confirmChanges() {
    Swal.fire({
      title: "¿Estas seguro de actualizar la información?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#a2aadb",
      cancelButtonColor: "#a53f3f",
      confirmButtonText: "Si, actualizar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
          console.log("Información actualizada");
      }
    });
  }

  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
   this.isModalOpen.set(false);
  }
}
