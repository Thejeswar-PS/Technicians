import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { UserModel } from '../../../models/user.model';
import { AuthModel, LoginResponse } from '../../../models/auth.model';
import { UsersTable } from '../../../../../_fake/users.table';
import { environment } from '../../../../../../environments/environment';

const API_USERS_URL = `${environment.apiUrl}/users`;

@Injectable({
  providedIn: 'root',
})
export class AuthHTTPService {

  //API : string = 'http://www.testquoteapi.com/api';
  //API : string = 'https://localhost:5001/api';
  //API : string = environment.apiUrl;
  API : string = environment.apiUrl;


  constructor(private http: HttpClient) {}

  // public methods
  // login(email: string, password: string): Observable<any> {
  //   const notFoundError = new Error('Not Found');
  //   if (!email || !password) {
  //     return of(notFoundError);
  //   }

  //   return this.getAllUsers().pipe(
  //     map((result: UserModel[]) => {
  //       if (result.length <= 0) {
  //         return notFoundError;
  //       }

  //       const user = result.find((u) => {
  //         return (
  //           u.email.toLowerCase() === email.toLowerCase() &&
  //           u.password === password
  //         );
  //       });
  //       if (!user) {
  //         return notFoundError;
  //       }

  //       const auth = new AuthModel();
  //       auth.authToken = user.authToken;
  //       auth.refreshToken = user.refreshToken;
  //       auth.expiresIn = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
  //       return auth;
  //     })
  //   );
  // }
  login(username: string, password: string): Observable<any> {
    return this.http.post<LoginResponse>(`${this.API}/user/Login`, {
      username,
      password,
    });
  }

  updatePassword(userName: string, password: string, newPassword: string) : Observable<any>
  {
    return this.http.put(`${this.API}/user/UpdatePassword`, {
      userName,
      password,
      newPassword
    },{ observe: 'response' });
  }

  createUser(user: UserModel): Observable<any> {
    user.roles = [2]; // Manager
    user.authToken = 'auth-token-' + Math.random();
    user.refreshToken = 'auth-token-' + Math.random();
    user.expiresIn = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
    user.pic = './assets/media/avatars/300-1.jpg';

    return this.http.post<UserModel>(API_USERS_URL, user);
  }

  forgotPassword(email: string): Observable<boolean> {
    return this.getAllUsers().pipe(
      map((result: UserModel[]) => {
        const user = result.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        return user !== undefined;
      })
    );
  }

  getUserByToken(token: string): Observable<UserModel | undefined> {
    const user = UsersTable.users.find((u: UserModel) => {
      return u.authToken === token;
    });

    if (!user) {
      return of(undefined);
    }

    return of(user);
  }

  getAllUsers(): Observable<UserModel[]> {
    return this.http.get<UserModel[]>(API_USERS_URL);
  }
}
