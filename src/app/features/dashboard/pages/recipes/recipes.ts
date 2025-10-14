import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { allRecipes } from '../../../../core/stores/recipes.store';
import { take, timeout, TimeoutError } from 'rxjs';
import { RecipesService } from '../../../../core/services/recipes';
import { HttpErrorResponse } from '@angular/common/http';
import { Spinner } from '../../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-recipes',
  imports: [CommonModule, RouterModule, Spinner],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css',
  standalone: true,
})
export class Recipes {
  isModalOpen = signal(false);
  selectedRecipeId = signal<number | null>(null);
  recipes = computed(() => allRecipes());
  recipe = signal<any>({});
  ingredientsList = signal<string[]>([]);
  instructionsList = signal<string[]>([]);
  comments = signal<any[]>([]);

  loading = signal(true);
  loadingRecipe = signal(true);
  deleteRequest = signal(false);

  //FILTROS
  searchBar = signal('');
  dateStart = signal<string>('');
  dateEnd = signal<string>('');
  activeDateRange = signal<{ start: string; end: string }>({ start: '', end: '' });

  filteredRecipes = computed(() => {
    const normalize = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const text = normalize(this.searchBar().trim());
    const { start, end } = this.activeDateRange();
    const allRecipes = this.recipes() as any[];

    let filtered = !text
      ? allRecipes
      : allRecipes.filter(recipe =>
          normalize(recipe.title).includes(text) ||
          normalize(recipe.user.user_name).includes(text)
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
      
      filtered = filtered.filter(recipe => {
          const recipeDate = new Date(recipe.created_at);

          const startTime = startDate ? startDate.getTime() : -Infinity;
          const endTime = endDate ? endDate.getTime() : Infinity;

          return recipeDate.getTime() >= startTime && recipeDate.getTime() < endTime;
      });
    }

    return filtered;
  });

  title = computed(() => {
    const text = this.searchBar().trim();
    const resultsCount = this.filteredRecipes().length;

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
    this.activeDateRange.set({ start: '', end: '' });
  }

  // PAGINACION
  p = signal(1);
  perPage = 5;  

  paginatedRecipes = computed(() => {
    const start = (this.p() - 1) * this.perPage;
    return this.filteredRecipes().slice(start, start + this.perPage);
  });

  totalPages = computed(() => 
    Math.ceil(this.filteredRecipes().length / this.perPage)
  );

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.p.set(page);
    }
  }

  startIndex = computed(() => {
    const total = this.filteredRecipes().length;
    if (total === 0) return 0;
    return (this.p() - 1) * this.perPage + 1;
  });

  endIndex = computed(() => {
    const total = this.filteredRecipes().length;
    if (total === 0) return 0;
    const end = this.p() * this.perPage;
    return end > total ? total : end;
  });

  // SCORE DE LA RECETA INDIVIDUAL
  averageScore = computed(() => {
    const list = this.comments();
    if (!list.length) return '0.0';
    const total = list.reduce((acc, comment) => acc + comment.score, 0);
    return (total / list.length).toFixed(1);
  });
  
  // ICONOS
  icons: Record<string, string> = {
    'femenino': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarF.png',
    'masculino': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarM.png',
    '39 tipos de gays': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarG.png'
  }

  constructor(private recipeService: RecipesService) {}

  ngOnInit() {
    this.getRecipes();
  }

  openModal(recipeId: number): void {
    this.selectedRecipeId.set(recipeId);
    this.recipe.set({});
    this.ingredientsList.set([]);
    this.instructionsList.set([]);
    this.comments.set([]);
    this.isModalOpen.set(true);

    this.getRecipe(recipeId);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedRecipeId.set(null);
    this.loadingRecipe.set(true);
  }

  approveRecipe(): void {
    console.log(`Aprobando receta con ID: ${this.selectedRecipeId}`);
    this.closeModal();
  }

  getRecipes() {
    this.recipeService.getAllRecipes().pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
          if (response.result) {
          const recipesWithScore = response.data.map((recipe: any) => ({
            ...recipe,
            averageScore: this.calculateTotalScore(recipe)
          }));

          allRecipes.set(recipesWithScore);
          this.loading.set(false);
        }
      },
      error: (error) => {
        this.loading.set(false);
      }
    });
  }

  getRecipe(id: any) {
    this.recipeService.getRecipe(id).pipe(timeout(1500), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          const r = response.data;
          this.recipe.set(r);
          this.ingredientsList.set(r.ingredients.split(',').map((i: any) => i.trim()));
          this.instructionsList.set(r.instructions.split('.').map((s: any) => s.trim()).filter((s: any) => s !== ''));
          this.comments.set((r.comments || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

          this.loadingRecipe.set(false);
        }
      },
      error: (error: HttpErrorResponse | TimeoutError) => {
        this.loadingRecipe.set(false);
      }
    });
  }

  // SCORE RECETAS TABLA
  calculateTotalScore(recipe: any): number {
    if (!recipe.comments || !Array.isArray(recipe.comments) || recipe.comments.length === 0) {
      return 0;
    }

    const validScores = recipe.comments.map((comment: any) => {
      const score = Number(comment.score);
      return isNaN(score) ? null : score;
    }).filter((score: any) => score !== null);

    if (validScores.length === 0) return 0;

    const totalScore = validScores.reduce((sum: any, score: any) =>sum + score, 0);
    const averageScore = totalScore / validScores.length;

    return parseFloat(averageScore.toFixed(1));
  }

  capitalize(text: string) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  confirmDeleteRecipe(id: any) {
    Swal.fire({
      title: "¿Estas seguro de eliminar esta receta?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#a2aadb",
      cancelButtonColor: "#a53f3f",
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteRecipe(id);
      }
    });
  }

  deleteRecipe(id: any) {
    this.deleteRequest.set(true);
    
    this.recipeService.deleteRecipe(id).pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          Swal.fire({
            title: '¡Receta eliminada!',
            icon: 'success',
            confirmButtonColor: "#a2aadb",
            confirmButtonText: 'Aceptar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.getRecipes();
              this.deleteRequest.set(false);
            }
          });
        }
      },
      error: (error: HttpErrorResponse | TimeoutError) => {
        if (error instanceof TimeoutError) {
          this.deleteRecipe(id);
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

        this.deleteRequest.set(false);
      }
    });
  }

  getIcon(gender?: string): string {
    const genderKey = gender?.toLowerCase() ?? 'default';
    return this.icons[genderKey] ?? 'https://ionicframework.com/docs/img/demos/avatar.svg';
  }
}
