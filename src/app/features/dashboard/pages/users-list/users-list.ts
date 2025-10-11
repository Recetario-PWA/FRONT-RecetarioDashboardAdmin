import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
  standalone: true,
})
export class UsersList {

  constructor() {}

  ngOnInit() {}

  confirmDeleteUser() {
    Swal.fire({
      title: "¿Estas seguro de eliminar a este usuario?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#a2aadb",
      cancelButtonColor: "#a53f3f",
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
         console.log("Usuario eliminado");
      }
    });
  }
}
