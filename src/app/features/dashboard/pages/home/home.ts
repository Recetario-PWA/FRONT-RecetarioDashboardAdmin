import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { recentRoleRequest } from '../../../../core/stores/users.store';
import { recentRecipes } from '../../../../core/stores/recipes.store';
import { UsersService } from '../../../../core/services/users';
import { RecipesService } from '../../../../core/services/recipes';
import { take, timeout, TimeoutError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Spinner2 } from '../../../../shared/components/spinner2/spinner2';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, Spinner2],
  templateUrl: './home.html',
  styleUrl: './home.css',
  standalone: true,
})
export class Home {
  requests = computed(() => recentRoleRequest());
  recipes = computed(() => recentRecipes());
  loadingRecipes = signal(true);
  loadingRequests = signal(true);
  sendingRequest = signal(false);

  icons: Record<string, string> = {
    'femenino': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarF.png',
    'masculino': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarM.png',
    '39 tipos de gays': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarG.png'
  }

  constructor(private userService: UsersService, private recipeService: RecipesService) {}

  ngOnInit(): void {
    this.getRecentRecipes();
    this.getRecentsRequests();
  }

  getRecentRecipes() {
    this.recipeService.getAllRecipes().pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          let recipesWithScore = response.data.map((recipe: any) => ({
            ...recipe,
            averageScore: this.calculateTotalScore(recipe)
          }));

          recipesWithScore.sort((a: any, b: any) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            
            return dateB - dateA;
          });

          const recentFourRecipes = recipesWithScore.slice(0, 4);

          recentRecipes.set(recentFourRecipes);
        } else {
          recentRecipes.set(null);
        }
        this.loadingRecipes.set(false);
      },
      error: (error) => {
        this.loadingRecipes.set(false);
      }
    });
  }

  // SCORE RECETAS TABLA
  calculateTotalScore(recipe: any): string {
    if (!recipe.comments || !Array.isArray(recipe.comments) || recipe.comments.length === 0) {
        return '0.0'; 
    }

    const validScores = recipe.comments.map((comment: any) => {
        const score = Number(comment.score);
        return isNaN(score) ? null : score;
    }).filter((score: any) => score !== null)

    if (validScores.length === 0) return '0.0';

    const totalScore = validScores.reduce((sum: any, score: any) => sum + score, 0);
    const averageScore = totalScore / validScores.length;

    return averageScore.toFixed(1); 
  }

  getIcon(gender?: string): string {
    const genderKey = gender?.toLowerCase() ?? 'default';
    return this.icons[genderKey] ?? 'https://ionicframework.com/docs/img/demos/avatar.svg';
  }

  getRecentsRequests() {
    this.userService.getAllRolRequest().pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          let requests = response.data;
          
          const pendingRequests = requests.filter((request: any) => 
            request.status === 'pendiente'
          );

          pendingRequests.sort((a: any, b: any) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();

            return dateB - dateA;
          });

          const recentFourPending = pendingRequests.slice(0, 4);

          recentRoleRequest.set(recentFourPending);
        } else {
          recentRoleRequest.set(null);
        }
        this.loadingRequests.set(false);
      },
      error: (error) => {
        recentRoleRequest.set(null);
        this.loadingRequests.set(false);
        console.log(error);
      }
    });
  }

  changeRole(id: any) {
    this.sendingRequest.set(true);
    this.userService.updateRole(id, true).pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          this.getRecentsRequests();
        } else {
          this.getRecentsRequests();
        }
        this.sendingRequest.set(false);
      },
      error: (error: HttpErrorResponse | TimeoutError) => {
        console.log(error);
        this.sendingRequest.set(false);
      }
    });
  }
}
