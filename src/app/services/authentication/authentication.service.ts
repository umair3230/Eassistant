import { Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(private http: HttpService) { }

  isSSOUser(email: string){
    return this.http.post(`/account/SsoExtension?platform=3`, {email: email, tenancyName: null})
  }

  login(username: string , password: string){
    return this.http.postHeaders(`/tokenauth/authenticate-user`, {email: username, password: password, platform: 3})
  }
}
