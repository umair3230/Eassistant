import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpService {
  constructor(private http: HttpClient) {}
  get(url: any) {
    return this.http.get(environment.DomainURL + url);
  }
  post(url: any, body: any) {
    return this.http.post(environment.DomainURL + url, body);
  }
  put(url: any, body: any) {
    return this.http.post(environment.DomainURL + url, body);
  }
  patch(url: any, body: any) {
    return this.http.patch(environment.DomainURL + url, body);
  }
  delete(url: any, body?: any) {
    return this.http.delete(environment.DomainURL + url, body);
  }
  //Todo: use a better approach
  postHeaders(url:any, body:any){
    const headers: any = {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers':
        'Access-Control-Allow-Headers, Origin,Accept, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers',
      'access-control-allow-methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
      'access-control-allow-origin': '*',
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded',
      pragma: 'no-cache',
      source: 'web-recorder'
    };
    return this.http.post(environment.DomainURL + url, body, {headers: headers});
  }
  fetchFile(url: any) {
    const headers = new HttpHeaders({
      Accept: 'text/csv'
    });
    const options = { headers };
    return this.http.post(url, null, options);
  }
}
