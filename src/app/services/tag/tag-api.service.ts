import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseModel } from '../../models/response';
import { TagModel } from '../../models/tag.model';
import { StateService } from '../state/state.service';

@Injectable({
  providedIn: 'root'
})
export class TagApiService {
  private readonly API_URL = `${environment.apiUrl}/tags`;

  constructor(
    private readonly http: HttpClient,
    private readonly stateService: StateService
  ) {}

  getTags(): Observable<TagModel[]> {
    return this.http.get<unknown>(this.API_URL, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((response) => this.normalizeTagsResponse(response))
    );
  }

  private normalizeTagsResponse(response: unknown): TagModel[] {
    if (Array.isArray(response)) {
      return this.mapTags(response);
    }

    const envelope = response as ResponseModel<unknown>;
    if (envelope && Array.isArray(envelope.data)) {
      return this.mapTags(envelope.data);
    }

    return [];
  }

  private mapTags(rawTags: unknown[]): TagModel[] {
    return rawTags
      .map((item) => {
        const tag = item as Record<string, unknown>;
        const id = tag['id'];
        const nome = tag['nome'];

        if (typeof id !== 'number' || typeof nome !== 'string') {
          return null;
        }

        return {
          id,
          nome,
          descricao: typeof tag['descricao'] === 'string' ? tag['descricao'] : null,
          cor: typeof tag['cor'] === 'string' ? tag['cor'] : null
        } as TagModel;
      })
      .filter((tag): tag is TagModel => tag !== null);
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.stateService.token}`
    });
  }
}
