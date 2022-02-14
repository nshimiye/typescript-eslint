

function MyPromiseFunction() {
  return Promise.resolve('promise');
}



import { of } from 'rxjs';

function MyEventFunction() {
  return of('event');
}



// MyPromiseFunction().then(console.log);
MyEventFunction().toPromise().then(console.log);
MyEventFunction().subscribe(console.log);

