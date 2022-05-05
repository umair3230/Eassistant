/// <reference types="chrome"/> 
import { Component, OnInit } from '@angular/core';
import { DocumentsService } from '../services/documents.service';
@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent implements OnInit {

  documents : any;
  form = {
    email:'',
    password:'',
  }
  constructor(documents:DocumentsService) {
    this.documents = documents.getAllDocuments();
   }

  closeSidebar(){
    chrome.runtime.sendMessage({ type: 'someMessage' }, () => {
      console.log('test sent');
    });
   }
  ngOnInit(): void {
    // get data from remote source and append it in sidepanel.

//     var docsEl = document.querySelector('.plays-cards-list');
//     var loaderEl = document.querySelector('.loader');

//     // get the docs from API
//     var getDocs = async (page, limit) => {
//         var API_URL = `url?page=${page}&limit=${limit}`;
//         var response = await fetch(API_URL);
//         // handle 404
//         if (!response.ok) {
//             throw new Error(`An error occurred: ${response.status}`);
//         }
//         return await response.json();
//     }

//     // show the docs
//     var showDocs = (docs) => {
//         docs.forEach(doc => {
//             var docEl = document.createElement('li');
//             docEl.classList.add('single-play-card');

//             docEl.innerHTML = `
//             <div class="play-content-icon">
//                 <img src="${doc.img_url}" alt="${doc.title}">
//                 <div class="play-content">
//                     <h2 class="play-heading">${doc.title}</h2>
//                     <p class="play-des">${doc.desc}</p>
//                 </div>
//             </div>
//                 `;

//         docsEl.prepend(docEl);
//         });
//     };

//     var hideLoader = () => {
//         loaderEl.classList.remove('show');
//     };

//     var showLoader = () => {
//         loaderEl.classList.add('show');
//     };

//     var hasMoreDocs = (page, limit, total) => {
//         var startIndex = (page - 1) * limit + 1;
//         return total === 0 || startIndex < total;
//     };

//     // load docs
//     var loadDocs = async (page, limit) => {

//         // show the loader
//         showLoader();

//         // 0.5 second later
//         setTimeout(async () => {
//             try {
//                 // if having more docs to fetch
//                 if (hasMoreDocs(page, limit, total)) {
//                     // call the API to get docs
//                     var response = await getDocs(page, limit);
//                     // show docs
//                     showDocs(response.data);
//                     // update the total
//                     total = response.total;
//                 }
//             } catch (error) {
//                 console.log(error.message);
//             } finally {
//                 hideLoader();
//             }
//         }, 500);

//     };

//     // control variables
//     var currentPage = 1;
//     var limit = 10;
//     var total = 0;


//     window.addEventListener('scroll', () => {
//         var {
//             scrollTop,
//             scrollHeight,
//             clientHeight
//         } = document.documentElement;

//         if (scrollTop + clientHeight >= scrollHeight - 5 &&
//             hasMoreDocs(currentPage, limit, total)) {
//             currentPage++;
//             loadDocs(currentPage, limit);
//         }
//     }, {
//         passive: true
//     });

//     // initialize
//     loadDocs(currentPage, limit);


  }
  switchTabs(){
   
  }

  onLoginSubmit(){
    //send auth request here
  }
}
