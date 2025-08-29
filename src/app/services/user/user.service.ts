import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseModel } from '../../models/response';
import { UserModel } from '../../models/user';
import { StateService } from '../state/state.service';
import { NarratorNicknameModel } from '../../models/narratorNickname';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  API_URL = environment.apiUrl + `/user-app/user`;
  API_PUBLIC_URL = environment.apiUrl + `/public/user`;
  constructor(
    private http: HttpClient,
    private stateService: StateService
  ) { }

  getUserProfile(): Observable<ResponseModel<UserModel>> {
    const token = this.stateService.token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ResponseModel<UserModel>>(
      `${this.API_URL}/me`,
      { headers }
    );
  }

  registerUser(userData: UserModel): Observable<ResponseModel<UserModel>> {
    return this.http.post<ResponseModel<UserModel>>(
      `${this.API_PUBLIC_URL}/register`,
      userData
    );
  }

  getNarratorName(id: number): Observable<ResponseModel<NarratorNicknameModel>> {
    const token = this.stateService.token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ResponseModel<NarratorNicknameModel>>(
      `${this.API_URL}/narrator-name/${id}`,
      { headers }
    );
  }

  updateUserProfile(updatedData: UserModel): Observable<ResponseModel<UserModel>> {
    const token = this.stateService.token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<ResponseModel<UserModel>>(
      `${this.API_URL}/update-profile/${updatedData.id}`,
      updatedData,
      { headers }
    );
  }
}
