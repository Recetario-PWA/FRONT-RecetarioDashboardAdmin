import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { allUsersList } from '../../../../core/stores/users.store';
import { Spinner } from '../../../../shared/components/spinner/spinner';
import { UsersService } from '../../../../core/services/users';
import { take, timeout, TimeoutError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-users-list',
  imports: [CommonModule, RouterModule, Spinner],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
  standalone: true,
})
export class UsersList {
  users = computed(() => allUsersList());
  loading = signal(true);
  sending = signal(false);

  // ICONOS
  icons: Record<string, string> = {
    'femenino': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarF.png',
    'masculino': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarM.png',
    '39 tipos de gays': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarG.png'
  }

  //FILTROS
  searchBar = signal('');
  dateStart = signal<string>('');
  dateEnd = signal<string>('');
  roleFilter = signal<string>('');
  activeDateRange = signal<{ start: string; end: string }>({ start: '', end: '' });

  filteredUsers = computed(() => {
    const normalize = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const text = normalize(this.searchBar().trim());
    const { start, end } = this.activeDateRange();
    const allUsers = this.users() as any[];

    let filtered = !text
      ? allUsers
      : allUsers.filter(user =>
          normalize(user.name).includes(text) ||
          normalize(user.user_name).includes(text) ||
          normalize(user.last_name).includes(text) ||
          normalize(user.email).includes(text)
        );

    const getCorrectedDate = (dateInput: any) => {
      if (!dateInput) return null;

      const d = new Date(dateInput);
      
      d.setHours(d.getHours() + 12);
      
      d.setHours(0, 0, 0, 0); 
      
      return d;
    };

    if (start || end) {
      const startDate = getCorrectedDate(start);
      let endDate = getCorrectedDate(end);
      
      if (endDate) {
          endDate.setDate(endDate.getDate() + 1);
      }
      
      filtered = filtered.filter(user => {
          const userDate = new Date(user.created_at);

          const startTime = startDate ? startDate.getTime() : -Infinity;
          const endTime = endDate ? endDate.getTime() : Infinity;

          return userDate.getTime() >= startTime && userDate.getTime() < endTime;
      });
    }

    const filterByRol = this.roleFilter();
    if (filterByRol) {
      filtered = filtered.filter(user => user.rol.role === filterByRol);
    }

    return filtered;
  });

  title = computed(() => {
    const text = this.searchBar().trim();
    const resultsCount = this.filteredUsers().length;

    if (!text) {
      return 'Todas las recetas';
    } else if (resultsCount === 0) {
      return 'No hay resultados';
    } else if (resultsCount === 1) {
      return '1 resultado encontrado';
    } else {
      return `${resultsCount} resultados encontrados`;
    }
  });

  applyDateFilter() {
    const start = this.dateStart();
    const end = this.dateEnd();

    if (start && end && new Date(end) < new Date(start)) {
      Swal.fire({
        icon: 'error',
        title: 'Rango de fechas inválido',
        text: 'La fecha "Hasta" no puede ser anterior a la fecha "Desde".',
        confirmButtonColor: '#a2aadb'
      });
      return;
    }

    this.activeDateRange.set({ start, end });
  }

  clearFilters() {
    this.searchBar.set('');
    this.dateStart.set('');
    this.dateEnd.set('');
    this.roleFilter.set('');
    this.activeDateRange.set({ start: '', end: '' });
  }

  // PAGINACION
  p = signal(1);
  perPage = 5;  

  paginatedUsers = computed(() => {
    const start = (this.p() - 1) * this.perPage;
    return this.filteredUsers().slice(start, start + this.perPage);
  });

  totalPages = computed(() => 
    Math.ceil(this.filteredUsers().length / this.perPage)
  );

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.p.set(page);
    }
  }

  startIndex = computed(() => {
    const total = this.filteredUsers().length;
    if (total === 0) return 0;
    return (this.p() - 1) * this.perPage + 1;
  });

  endIndex = computed(() => {
    const total = this.filteredUsers().length;
    if (total === 0) return 0;
    const end = this.p() * this.perPage;
    return end > total ? total : end;
  });

  constructor(private userService: UsersService) {}

  ngOnInit() {
    this.getAllUsers();
  }

  getAllUsers() {
    this.userService.getAllUsers().pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          allUsersList.set(response.data);
        } else {
          allUsersList.set([]);
        }
        this.loading.set(false);
      },
      error: (error) => {
        allUsersList.set([]);
        this.loading.set(false);
        console.log(error);
      }
    });
  }

  deleteUser(id: any) {
    this.sending.apply(true);

    this.userService.deleteUser(id).pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          if (response.result) {
            Swal.fire({
              title: 'Usuario eliminado!',
              icon: 'success',
              confirmButtonColor: "#a2aadb",
              confirmButtonText: 'Aceptar'
            }).then((result) => {
              if (result.isConfirmed) {
                this.getAllUsers();
                this.sending.set(false);
              }
            });
          }
        }
      },
      error: (error: HttpErrorResponse | TimeoutError) => {
        if (error instanceof TimeoutError) {
          this.deleteUser(id);
          return;
        }

        const httpError = error as HttpErrorResponse;

        const serverMsg = httpError.error?.msg || 'Ha ocurrido un error inesperado. (Error 404/500)';
        const data = httpError.error?.data as Record<string, any> | undefined;

        let htmlMsg = '';

        if (data) {
          const validationMessages = ([] as string[]).concat(
            ...Object.values(data)
          );

          if (validationMessages.length > 0) {
            htmlMsg = validationMessages.map(err => `* ${err}`).join('<br>');
          }
        }

        Swal.fire({
          title: 'Error',
          html: htmlMsg || serverMsg,
          icon: 'error',
          confirmButtonColor: "#a2aadb",
          confirmButtonText: 'Aceptar'
        });

        //console.log(error);
        this.sending.set(false);
      }
    });
  }

  confirmDeleteUser(id: any) {
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
        this.deleteUser(id);
      }
    });
  }

  getIcon(gender?: string): string {
    const genderKey = gender?.toLowerCase() ?? 'default';
    return this.icons[genderKey] ?? 'https://ionicframework.com/docs/img/demos/avatar.svg';
  }
}
