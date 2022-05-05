import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../services/authentication/authentication.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  emailVerified: boolean = false;
  form: FormGroup | any;
  loading = false;
  submitted = false;
  constructor(
    private auth: AuthenticationService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  get f() {
    return this.form.controls;
  }
  isDoingSSOLogin() {
    this.auth.isSSOUser(this.f.username.value).subscribe((res: any) => {
      this.emailVerified = res.success;
      console.log(res);
      debugger;
    });
  }
  // implement login logic here, using the auth service

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login() {
    this.auth.login(this.f.username.value, this.f.password.value).subscribe(res => {
      console.log("logged in");
    });
  }
}
