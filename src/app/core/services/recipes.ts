import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipesService {
  private baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = `${environment.apiUrlBase}recipes/`;
  }

  getAllRecipes(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  getRecipe(id: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}${id}`);
  }

  deleteRecipe(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}${id}`);
  }
}
