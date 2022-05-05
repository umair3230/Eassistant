import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {

  constructor() { }

  getAllDocuments(){
    return [
      {
        title: "A Project",
        image: "An Image",
        gitURL: "gitURL",
        liveURL: "liveURL"
      },
      {
        title: "A Project",
        image: "An Image",
        gitURL: "gitURL",
        liveURL: "liveURL"
      }
    ]
  }

  getRelatedDocuments(){
    return [
      {
        title: "A Project",
        image: "An Image",
        gitURL: "gitURL",
        liveURL: "liveURL"
      },
      {
        title: "A Project",
        image: "An Image",
        gitURL: "gitURL",
        liveURL: "liveURL"
      }
    ]
  }

  
}
