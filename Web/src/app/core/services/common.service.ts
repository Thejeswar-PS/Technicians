import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  constructor(private http : HttpClient) { }

  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });

  API : string = environment.apiUrl;

  getAccountManagers()
  {
    return this.http.get(`${this.API}/Common/GetAccountManagers`,{ headers : this.headers });
  }

  getTechnicians()
  {
    return this.http.get(`${this.API}/Common/GetTechnicians`,{ headers : this.headers });
  }
  getStates()
  {
    return this.http.get(`${this.API}/Common/GetStates`,{ headers : this.headers });
  }


}
